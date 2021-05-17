import {NextFunction, Request, Response} from "express";
import auth from "../libs/auth";
import config from "config";
const configAuth: any = config.get('auth')

export function  verifyAuthRequired(req: Request, res: Response, next: NextFunction) {
  if (!req.query.key) {
    let token = req.header('X-Auth-Token')
    let encodedPublicKey = req.header('X-Public-Key')
    let encodedSignature = req.header('X-Signature')
    let payload = auth.getPayload(token, configAuth.secret)

    // TODO req에 user가 포함되지 않는 원인 파악
    req.user = payload.user

    try {
      auth.verifyHeaderField(token, encodedPublicKey, encodedSignature)
      auth.verifyPayload(token, configAuth.secret)
      auth.existsToken(token, configAuth.secret)
      auth.verifyToken(req.method, token, configAuth.secret)
      auth.verifySignature(encodedPublicKey, encodedSignature)
      next()
    }catch(error){
      res.status(error.code).send(JSON.stringify({"error": error.message}))
    }
  } else {
    next()
  }
}
