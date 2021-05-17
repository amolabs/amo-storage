import express, {NextFunction, Request, Response} from 'express'
import redis from "../libs/redis"
import config from 'config'
import multer from 'multer'
import s3Client from '../adapter/s3-adapter'
import files from '../libs/files'
import auth from '../libs/auth'
import rpc from '../libs/rpc'
import {validateFormData} from "../middleware/validate";
import {verifyAuthRequired} from "../middleware/verify";

const storage: any = config.get('storage')
const minio: any = config.get('minio')
const configAuth: any = config.get('auth')

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', verifyAuthRequired, validateFormData, upload.single('file'), async function (req, res, next) {
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

        await s3Client.existsBucket()
        await s3Client.existsObject('', parcelId)
        await s3Client.upload(parcelId, file.buffer, file.size)
        files.saveParcelInfo(parcelId, owner, metadata)

        res.json({"id": parcelId});
    } catch (error) {
        res.status(error.code).json({"error": error.message})
    }
});

router.get('/:parcel_id([a-zA-Z0-9]+)', verifyAuthRequired, async function (req, res, next) {
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

router.get('/download/:parcel_id([a-zA-Z0-9]+)', verifyAuthRequired, async function (req: Request, res: Response, next: NextFunction) {
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


            await s3Client.existsBucket()
            await s3Client.existsObject('', parcelId)
            let stream: any = await s3Client.download(minio.bucket_name, parcelId)

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

router.delete('/:parcel_id([a-zA-Z0-9]+)', verifyAuthRequired, async function (req, res, next) {
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

        await s3Client.existsBucket()
        await s3Client.remove(minio.bucket_name, parcelId)
        files.deleteParcelInfo(parcelId)

        res.status(204).json({});
    } catch (error) {
        res.status(error.code).json({"error": error.message})
    }
});

export default router;