import {NextFunction, Request, Response} from "express";
import auth from "../libs/auth";
import config from "config";
import utils from "../libs/utils";
const configAuth: any = config.get('auth')

export function  verifyAuthRequired(req: Request, res: Response, next: NextFunction) {
  if (!req.query.key) {
    try {
      _verifyAll(req)

      let token = req.header('X-Auth-Token')
      let payload = auth.getPayload(token, configAuth.secret)
      req.user = payload.user

      next()
    }catch(error){
      utils.decorateErrorResponse(res, error).json({"error": error.message})
    }
  } else {
    next()
  }
}

function _verifyAll(req: Request) {
  let encodedPublicKey = req.header('X-Public-Key')
  let encodedSignature = req.header('X-Signature')
  let token = req.header('X-Auth-Token')
  let payload = auth.getPayload(token, configAuth.secret)

  if (!auth.verifyHeaderField(token, encodedPublicKey, encodedSignature)) {
    throw {
      code: 401,
      message: "One or more required fields do not exist in the header"
    }
  }

  if (!auth.verifyPayload(token, configAuth.secret)) {
    throw {
      code: 401,
      message: "Invalid token"
    }
  }

  if (!auth.existsToken(token, configAuth.secret)) {
    throw {
      code: 401,
      message: "Token does not exist"
    }
  }

  if (!auth.verifyToken(req.method, token, configAuth.secret)) {
    throw {
      code: 401,
      message: `Token is only available to perform ${payload.operation.name}`
    }
  }

  if (!auth.verifySignature(token, encodedPublicKey, encodedSignature)) {
    throw {
      code: 401,
      message: "Verification failed"
    }
  }
}
