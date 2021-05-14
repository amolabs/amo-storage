import * as buffer from "buffer";

const appName = 'amo-storage'

import express, {NextFunction, Request, Response} from 'express';
import {redisClient} from "../lib/redis";
import jwt from 'jsonwebtoken'
import _config from 'config'
import crypto from 'crypto'
import multer from 'multer'
import {getOwnership, getMetadata, saveParcelInfo, Ownership, Metadata, deleteParcelInfo} from "../lib/files";
import minIo from '../adapter/minio-adapter'
import axios from "axios";
import { v4 } from 'uuid'
const config: any = _config.get(appName)
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', _verifyAuthRequired, _validateFormData, upload.single('file'), async function (req, res, next) {
    let owner = req.body.owner
    let metadata = req.body.metadata
    let file = req.file

    let hash = crypto.createHash('sha256')
    hash.update(owner)
    hash.update(metadata)
    hash.update(file.buffer)

    let localId = hash.digest('hex').toUpperCase()
    let parcelId = `${config.storage.storage_id}${localId}`

    try {
        if(_existsParcelId(parcelId)){
            return res.json({"id": parcelId})
        }

        await minIo.upload(parcelId, file.buffer, file.size)
        saveParcelInfo(parcelId, owner, metadata)

        res.json({"id": parcelId});
    } catch (error) {
        res.status(error.code).json({"error": error.message})
    }
});

router.get('/:parcel_id([a-zA-Z0-9]+)', _verifyAuthRequired, async function (req, res, next) {
    const parcelId = req.params.parcel_id
    const key = req.query.key

    try {
        if (key == 'metadata') {
            const metadata: Metadata = await getMetadata(parcelId)
            res.json({"metadata": metadata.parcel_meta})
        } else if (key == 'owner') {
            const ownership: Ownership = await getOwnership(parcelId);
            res.json({"owner": ownership.owner});
        } else {
            throw {
                code: 400,
                message: "Query key is invalid"
            }
        }
    } catch (error) {
        res.status(error.code).json({"error": error.message});
    }
});

router.get('/download/:parcel_id([a-zA-Z0-9]+)', _verifyAuthRequired, async function (req: Request, res: Response, next: NextFunction) {
    const parcelId = req.params.parcel_id
    try {
        const ownership: Ownership = await getOwnership(parcelId)
        const metadata: Metadata = await getMetadata(parcelId)
        if (req.user != ownership.owner) {
            let res = await _usage_query(parcelId, req.user)

            if (res.data.result.response.code != 0) {
                throw {
                    code: 403,
                    message: `No permission to download data parcel ${parcelId}`
                }
            }


            let stream: any = await minIo.download(config.minio.bucket_name, parcelId)

            stream.pipe(res)
            stream.on('finish', () => {
                _deleteKey(req)
            })
        }
    } catch (error) {
        res.status(error.code).json({"error": error.message})
    }
});

router.delete('/:parcel_id([a-zA-Z0-9]+)', _verifyAuthRequired, async function (req, res, next) {
    const parcelId = req.params.parcel_id
    try {
        const ownership: Ownership = await getOwnership(parcelId)

        if(!_existsParcelId(parcelId)){
            throw {
                code: 410,
                message: "Parcel does not exist"
            }
        }

        if (req.user != ownership.owner) {
            throw {
                code: 405,
                message: "Not allowed to remove parcel"
            }
        }
        await minIo.remove(config.minio.bucket_name, parcelId)
        deleteParcelInfo(parcelId)

        res.status(204).json({});
    } catch (error) {
        res.status(error.code).json({"error": error.message})
    }
});

async function _existsParcelId(parcelId: string) {
    const ownership: Ownership = await getOwnership(parcelId)
    const metadata: Metadata = await getMetadata(parcelId)

    return ownership && metadata
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
        res.status(error.code).send(JSON.stringify({"error": error.message}))
    }
}

function  _verifyAuthRequired(req: Request, res: Response, next: NextFunction) {
    if (!req.query.key) {
        let token = req.header('X-Auth-Token')
        let encodedPublicKey = req.header('X-Public-Key')
        let encodedSignature = req.header('X-Signature')
        let key = _getKey(token)
        let payload = _getPayload(token)

        // TODO req에 user가 포함되지 않는 원인 파악
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

function _deleteKey(req: Request) {
    let token = req.header('X-Auth-Token')
    let key = _getKey(token)

    try {
        redisClient.del(key)
    } catch (error) {
        throw {
            code: 500,
            message: "Delete key failed"
        }
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

async function _usage_query(parcel_id: string, recipient: string | undefined) {
    const endpoint = `http://${config.amo_blockchain_node.host}:${config.amo_blockchain_node.port}`
    const requestHeaders = {
        headers: {
            "Content-Type": "application/json"
        }
    }
    const requestBody = {
        "jsonrpc": "2.0",
        "id": v4(),
        "method": "abci_query",
        "params": {
            "path": "/usage",
            "data": Buffer.from(JSON.stringify({"recipient": recipient, "target": parcel_id}), 'utf-8').toString('hex')
        }
    }

    try {
        let res = await axios.post(endpoint, requestBody, requestHeaders)
        return res;
    } catch (error) {
        throw {
            code: 502,
            message: `${error}`
        }
    }
}

export default router;