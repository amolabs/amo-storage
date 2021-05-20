import express from 'express'
import config from 'config'
import { v4 } from 'uuid'
import jwt from '../libs/auth'
import redis from "../libs/redis"
import {Auth} from '../types/auth-type'
import jsonValidator from '../libs/json-schema-validator'

const router = express.Router();
const auth: any = config.get('auth')

router.post('/', function (req, res, next) {
  let authJson: Auth = req.body
  try {
    jsonValidator.validateJsonSchema(authJson)

    authJson["iss"] = auth.issuer;
    authJson["jti"] = v4()

    const token = jwt.createToken(authJson, auth.secret, {algorithm: auth.algorithm})

    redis.save(`${authJson.user}:${authJson.operation.name}:${authJson.operation.id}`, token)
    console.log(" # token: ", token)
    res.status(200).send(JSON.stringify({"token": token}))
  } catch (error) {
    res.status(400).send(JSON.stringify({'error': error}))
  }
});

export default router;