import {Auth} from "../types/auth-type"
import jwt from "jsonwebtoken"
import redis from "./redis"
import { ec as EC } from 'elliptic'

function createToken(auth: Auth, secret: string, options?: object): string {
  return jwt.sign(auth, secret, options)
}

function existsToken(token: string = '', secret: string) {
  let key = getTokenKey(token, secret)
  if (!redis.get(key)) {
    throw {
      code: 401,
      message: "Token does not exist"
    }
  }
}

function verifyHeaderField(token = '', encodedPublicKey = '', encodedSignature = '') {
  if (!token || !encodedPublicKey || !encodedSignature) {
    throw {
      code: 401,
      message: "One or more required fields do not exist in the header"
    }
  }
}

function verifyToken(method: string, token = '', secret: string){
  let methodOperation = new Map([
    ["GET", "download"],
    ["POST", "upload"],
    ["DELETE", "remove"]
  ])
  let payload = getPayload(token, secret)

  if (methodOperation.get(method.toUpperCase()) != payload.operation.name) {
    throw {
      code: 401,
      message: `Token is only available to perform ${payload.operation.name}`
    }

  }
}

function verifyPayload(token = '', secret: string) {
  let payload = getPayload(token, secret)
  if (!payload) {
    throw {
      code: 401,
      message: "Invalid token"
    }
  }
}

function verifySignature(msgHex: string = '', pubkeyHex = '', sigHex = '') {
  const ecKey = new EC('p256').keyFromPublic(pubkeyHex, 'hex')
  const sigBuf = Buffer.from(sigHex, 'hex')
  const sig = { r: sigBuf.slice(0, 32), s: sigBuf.slice(32,64) }
  const result = ecKey.verify(msgHex, sig)
  if (!ecKey.verify(msgHex, sig)) {
    throw {
      code: 401,
      message: "Verification failed"
    }
  }
  return
}

function getTokenKey(token: string = '', secret: string) {
  let payload: any = jwt.verify(token, secret)
  return `${payload.user}:${payload.operation.name}:${payload.operation.id}`
}

function getPayload(token = '', secret: string) {
  let payload: any = jwt.verify(token, secret)
  if (!payload.user || !payload.operation)
    return null

  return payload
}

export default {
  createToken,
  existsToken,
  verifyHeaderField,
  verifyToken,
  verifyPayload,
  verifySignature,
  getTokenKey,
  getPayload
}
