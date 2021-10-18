import {NextFunction, Request, Response} from "express"
import auth from "../libs/auth"
import config from "config"
import utils from "../libs/utils"
import redis from "../libs/redis"
const configAuth: any = config.get('auth')

export async function  verifyAuthRequired(req: Request, res: Response, next: NextFunction) {
  console.log("# token:", req.header('X-Auth-Token'))
  console.log("# payload:", auth.getPayload(req.header('X-Auth-Token'), configAuth.secret))
  if (!req.query.key) {
    try {
      await _verifyAll(req)

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

async function _verifyAll(req: Request) {
  let encodedPublicKey = req.header('X-Public-Key')
  let encodedSignature = req.header('X-Signature')
  let token = req.header('X-Auth-Token')
  let payload = auth.getPayload(token, configAuth.secret)

  if (!await auth.verifyHeaderField(token, encodedPublicKey, encodedSignature)) {
    return Promise.reject({
      code: 401,
      message: "One or more required fields do not exist in the header"
    })
  }

  if (!auth.verifyPayload(token, configAuth.secret)) {
    return Promise.reject({
      code: 401,
      message: "Invalid token"
    })
  }

  const existsToken = await redis.existsToken(token, configAuth.secret)

  if (!existsToken) {
    return Promise.reject({
      code: 401,
      message: `Token does not exist`
    })
  }

  if (!auth.verifyToken(req.method, token, configAuth.secret)) {
    return Promise.reject({
      code: 401,
      message: `Token is only available to perform ${payload.operation.name}`
    })
  }

  if (!auth.verifySignature(token, encodedPublicKey, encodedSignature)) {
    return Promise.reject({
      code: 401,
      message: "Verification failed"
    })
  }
}
