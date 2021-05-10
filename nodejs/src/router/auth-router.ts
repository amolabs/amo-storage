const appName = 'amo-storage'

import express from 'express'
import _config from 'config'
import { v4 } from 'uuid'
import jwt from 'jsonwebtoken'
import {redisClient} from "../lib/redis";

const router = express.Router();
const config: any = _config.get(appName)

router.post('/', function (req, res, next) {
    let authJson = req.body

    // TODO 에러 체크

    authJson["iss"] = config.auth.issuer
    authJson["jti"] = v4()

    const token = jwt.sign(authJson, config.auth.secret, {algorithm: config.auth.algorithm})

    // TODO DB 저장 => Serialize 해야 되는지 확인
    redisClient.set(`${authJson.user}:${authJson.operation.name}:${authJson.operation.id}`, token)

    redisClient.get(`${authJson.user}:${authJson.operation.name}:${authJson.operation.id}`, (err, value) => {
        console.log("# authJson user's token: ", value)
    })

    res.status(200).send(JSON.stringify({"token": token}))
});

export default router;