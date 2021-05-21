import {Auth} from "../types/auth-type";
import jwt from "jsonwebtoken";
import redis from "./redis";
import crypto from "crypto";

function createToken(auth: Auth, secret: string, options?: object): string {
  return jwt.sign(auth, secret, options)
}

function existsToken(token: string = '', secret: string) {
  let key = getKey(token, secret)
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
  ]);
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

function verifySignature(encodedPublicKey = '', encodedSignature = '') {
  const verifier = crypto.createVerify('SHA256')
  if (!verifier.verify(encodedPublicKey, encodedSignature)) {
    throw {
      code: 401,
      message: "Verification failed"
    }
  }
}
function getKey(token: string = '', secret: string) {
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
  getKey,
  getPayload
}