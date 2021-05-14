const appName = 'amo-storage'

import express, {NextFunction, Request, Response} from 'express'
import _config from 'config'
import { v4 } from 'uuid'
import jwt from 'jsonwebtoken'
import {redisClient} from "../libs/redis";
import {schema} from "../schema/auth-schema";
import Ajv, {JSONSchemaType} from "ajv"
import {Auth} from '../types/auth-type'

const router = express.Router();
const config: any = _config.get(appName)

router.post('/', function (req, res, next) {
        let authJson: Auth = req.body
        try {
            _validateAuth(authJson)

            authJson["iss"] = config.auth.issuer;
            authJson["jti"] = v4()

            const token = jwt.sign(authJson, config.auth.secret, {algorithm: config.auth.algorithm})

            redisClient.set(`${authJson.user}:${authJson.operation.name}:${authJson.operation.id}`, token)



            res.status(200).send(JSON.stringify({"token": token}))
        } catch (error) {
            res.status(400).send(JSON.stringify({'error': error}))
        }
    }
);

function _validateAuth(auth: Auth) {
    const ajv = new Ajv()
    const validate = ajv.compile(schema)
    if (!validate(auth)) {
        throw validate.errors
    }
}

export default router;