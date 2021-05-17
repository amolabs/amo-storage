import express, {NextFunction, Request, Response} from 'express'
import redis from "../libs/redis"
import config from 'config'
import multer from 'multer'
import minIo from '../adapter/minio-adapter'
import files from '../libs/files'
import auth from '../libs/auth'
import rpc from '../libs/rpc'

const storage: any = config.get('storage')
const minio: any = config.get('minio')
const configAuth: any = config.get('auth')


const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', _verifyAuthRequired, _validateFormData, upload.single('file'), async function (req, res, next) {
    let owner: string = req.body.owner
    let metadata: string = JSON.stringify(req.body.metadata)
    let file = req.file

    let localId = files.createParcelId(owner, metadata, file.buffer)
    let parcelId = `${storage.storage_id}${localId}`

    try {
        let existsParcelId = await files.existsParcelId(parcelId)
        if(existsParcelId){
            return res.json({"id": parcelId})
        }

        await minIo.upload(parcelId, file.buffer, file.size)
        files.saveParcelInfo(parcelId, owner, metadata)

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
            const metadata = await files.getMetadata(parcelId)
            res.json({"metadata": metadata.parcel_meta})
        } else if (key == 'owner') {
            const ownership = await files.getOwnership(parcelId);
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
        const ownership = await files.getOwnership(parcelId)
        const metadata = await files.getMetadata(parcelId)
        if (req.user != ownership.owner) {
            let res = await rpc.usageQuery(parcelId, req.user)

            if (res.data.result.response.code != 0) {
                throw {
                    code: 403,
                    message: `No permission to download data parcel ${parcelId}`
                }
            }


            let stream: any = await minIo.download(minio.bucket_name, parcelId)

            stream.pipe(res)
            stream.on('finish', () => {
                let token = req.header('X-Auth-Token')
                let key = auth.getKey(token, configAuth.secret)
                redis.remove(key)
            })
        }
    } catch (error) {
        res.status(error.code).json({"error": error.message})
    }
});

router.delete('/:parcel_id([a-zA-Z0-9]+)', _verifyAuthRequired, async function (req, res, next) {
    const parcelId = req.params.parcel_id
    try {
        const ownership = await files.getOwnership(parcelId)

        let existsParcelId = await files.existsParcelId(parcelId)

        if(!existsParcelId){
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
        await minIo.remove(minio.bucket_name, parcelId)
        files.deleteParcelInfo(parcelId)

        res.status(204).json({});
    } catch (error) {
        res.status(error.code).json({"error": error.message})
    }
});

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

export default router;