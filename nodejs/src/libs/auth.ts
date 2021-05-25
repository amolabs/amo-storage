import {Auth} from "../types/auth-type"
import jwt from "jsonwebtoken"
import redis from "./redis"
import { createHash } from 'crypto'
import { ec as EC } from 'elliptic'

function createToken(auth: Auth, secret: string, options?: object): string {
  return jwt.sign(auth, secret, options)
}

function existsToken(token: string = '', secret: string) {
  let key = getTokenKey(token, secret)
  return redis.get(key)
}

function verifyHeaderField(token = '', encodedPublicKey = '', encodedSignature = '') {
  return token && encodedPublicKey && encodedSignature
}

function verifyToken(method: string, token = '', secret: string){
  let methodOperation = new Map([
    ["GET", "download"],
    ["POST", "upload"],
    ["DELETE", "remove"]
  ])
  let payload = getPayload(token, secret)

  return methodOperation.get(method.toUpperCase()) == payload.operation.name
}

function verifyPayload(token = '', secret: string) {
  return getPayload(token, secret)
}

function verifySignature(msg: string = '', pubkeyHex = '', sigHex = '') {
  const msgHash = createHash('sha256').update(msg).digest('hex');
  const ecKey = new EC('p256').keyFromPublic(pubkeyHex, 'hex')
  const sigBuf = Buffer.from(sigHex, 'hex')
  const sig = { r: sigBuf.slice(0, 32), s: sigBuf.slice(32,64) }

  return ecKey.verify(msgHash, sig)
}


function getTokenKey(token: string = '', secret: string) {
  let payload: any = jwt.verify(token, secret)
  return `${payload.user}:${payload.operation.name}:${payload.operation.id}`
}

function getPayload(token = '', secret: string) {
  const payload: any = jwt.verify(token, secret)
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
