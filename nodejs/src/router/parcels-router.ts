import {on} from "cluster";

const appName = 'amo-storage'

import express, {NextFunction, Request, Response} from 'express';
import {redisClient} from "../lib/redis";
import jwt from 'jsonwebtoken'
import _config from 'config'
import crypto from 'crypto'
import multer from 'multer'
import {getOwnership, getMetadata, saveParcelInfo} from "../lib/files";

const config: any = _config.get(appName)
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', _verifyAuthRequired, _validateFormData, upload.single('file'), function (req, res, next) {
    let owner = req.body.owner
    let metadata = req.body.metadata
    let file = req.file

    let hash = crypto.createHash('sha256')
    hash.update(owner)
    hash.update(metadata)
    hash.update(file.buffer)

    let localId = hash.digest('hex').toUpperCase()
    let parcelId = `${config.storage.storage_id}${localId}`

    // _existsParcelId(parcelId) TODO
    try {
        saveParcelInfo(parcelId, owner, metadata)
        res.send(JSON.stringify({ id: parcelId}));

        // TODO 스토리지에 파일 저장
    } catch (error) {
        res.status(error.code).send(JSON.stringify({"error": error.message}))
    }
});

router.get('/:parcel_id([a-zA-Z0-9]+)', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Get Specific parcel',
    }));
});

router.get('/download/:parcel_id([a-zA-Z0-9]+)', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Download Specific File by parcel id',
    }));
});

router.delete('/:parcel_id([a-zA-Z0-9]+)', function (req, res, next) {
    res.send(JSON.stringify({
        name: 'Delete Specific parcel by parcel id',
    }));
});

async function _existsParcelId(parcelId: string) {
    // TODO 200을 리턴해야되는 이유를 물어봐야 됨.
    const ownership = await getOwnership(parcelId)
    const metadata = await getMetadata(parcelId)
    try {
        if (ownership && metadata) {
            throw {
                code: 400,
                message: "'metadata' field is missing"
            }
        }
    } catch(error) {

    }
}

function _validateFormData(req: Request, res: Response, next: NextFunction) {
    let owner = req.body.owner
    let metadata = req.body.metadata
    let file = req.file

    try {
        if (!owner) {
            throw {
                code: 400,
                message: "'owner' field is missing"
            }
        }

        if (Object.keys(metadata).length === 0) {
            throw {
                code: 400,
                message: "'metadata' field is missing"
            }
        }

        if (Object.keys(file).length === 0) {
            throw {
                code: 400,
                message: "'file' field is missing"
            }
        }
        next()
    } catch (error){
        res.status(error.code).send(JSON.stringify({"error": error.message}));
    }


}

function _verifyAuthRequired(req: Request, res: Response, next: NextFunction) {
    if (!req.query.key) {
        let token = req.header('X-Auth-Token')
        let encodedPublicKey = req.header('X-Public-Key')
        let encodedSignature = req.header('X-Signature')
        let key = _getKey(token)
        let payload = _getPayload(token)
        req.user = payload.user

        try {
            _verifyHeaderField(token, encodedPublicKey, encodedSignature)
            _verifyPayload(token)
            _existsToken(key)
            _verifyToken(req.method, token)
            _verifySignature(encodedPublicKey, encodedSignature)
            next()
        }catch(error){
            res.status(error.code).send(JSON.stringify({"error": error.message}))
        }
    } else {
        next()
    }
}

function _verifyHeaderField(token = '', encodedPublicKey = '', encodedSignature = '') {
    if (!token || !encodedPublicKey || !encodedSignature) {
        throw {
            code: 401,
            message: "One or more required fields do not exist in the header"
        }
    }
}

function _verifyPayload(token = '') {
    let payload = _getPayload(token)
    if (!payload) {
        throw {
            code: 401,
            message: "Invalid token"
        }
    }
}

function _existsToken(key: string) {
    let valueByKey
    redisClient.get(key, (err, value) => {
        valueByKey = value
    })
    if (!valueByKey) {
        throw {
            code: 401,
            message: "Token does not exist"
        }
    }
}

function _verifyToken(method: string, token = '') {
    let methodOperation = new Map([
        ["GET", "download"],
        ["POST", "upload"],
        ["DELETE", "remove"]
    ]);
    let payload = _getPayload(token)

    if (methodOperation.get(method.toUpperCase()) != payload.operation.name) {
        throw {
            code: 401,
            message: `Token is only available to perform ${payload.operation.name}`
        }

    }
}

function _verifySignature(encodedPublicKey = '', encodedSignature = '') {
    const verifier = crypto.createVerify('SHA256')
    if (!verifier.verify(encodedPublicKey, encodedSignature)) {
        throw {
            code: 401,
            message: "Verification failed"
        }
    }
}
function _getPayload(token = '') {
    let payload: any = jwt.verify(token, config.auth.secret)
    if (!payload.user || !payload.operation)
        return null

    return payload
}

function _getKey(token = '') {
    let payload: any = jwt.verify(token, config.auth.secret)
    return `${payload.user}:${payload.operation.name}:${payload.operation.id}`
}
export default router;