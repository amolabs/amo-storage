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

router.post('/', verifyAuthRequired, upload.single('file'), async function (req, res, next) {
    try {
        validateFormData(req)
        let owner: string = req.body.owner
        let metadata: string = req.body.metadata

        let file = req.file

        let localId = files.createParcelId(owner, metadata, file.buffer)
        let parcelId = `${storage.storage_id}${localId}`

        let existsParcelId = await files.existsParcelId(parcelId)
        if(existsParcelId){
            return res.json({"id": parcelId})
        }

        await s3Client.upload(parcelId, file.buffer, file.size)
        await files.saveParcelInfo(parcelId, owner, metadata)

        res.json({"id": parcelId});
    } catch (error) {
        res = error.code ? res.status(error.code) : res
        return res.json({"error": error.message})
    }
});

router.get('/:parcel_id([a-zA-Z0-9]+)', /*verifyAuthRequired, TODO */ async function (req, res, next) {
    const parcelId = req.params.parcel_id
    const key = req.query.key

    try {
        if (key == 'metadata') {
            const metadata = await files.getMetadata(parcelId)
            res.json({"metadata": JSON.parse(metadata.parcel_meta)})
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
        res = error.code ? res.status(error.code) : res
        res.json({"error": error.message});
    }
});

router.get('/download/:parcel_id([a-zA-Z0-9]+)', /*verifyAuthRequired, TODO */ async function (req: Request, res: Response, next: NextFunction) {
    const parcelId = req.params.parcel_id
    req.user = "1E6C1528E4C04F5C879BE30F5A62121CE343308B"

    try {
        const ownership = await files.getOwnership(parcelId)
        const metadata = await files.getMetadata(parcelId)
        if (req.user != ownership.owner) {
            let res: any = await rpc.usageQuery(parcelId, req.user)

            if (res.data.result.response.code != 0) {
                throw {
                    code: 403,
                    message: `No permission to download data parcel ${parcelId}`
                }
            }
        }
        await s3Client.existsBucket(minio.bucket_name)
        await s3Client.existsObject(minio.bucket_name, parcelId)
        let stream: any = await s3Client.download(minio.bucket_name, parcelId)

        // TODO connector에서 다운로드가 끝난 후, key가 삭제 되는지 확인 필요
        stream.pipe(res)
        stream.on('finish', () => {
            console.log("# finish")
            let token = req.header('X-Auth-Token')
            let key = auth.getKey(token, configAuth.secret)
            redis.remove(key)
        })
    } catch (error) {
        console.log("# error: ", error)
        res = error.code ? res.status(error.code) : res
        res.json({"error": error.message})
    }
});

router.delete('/:parcel_id([a-zA-Z0-9]+)', /*verifyAuthRequired, TODO */  async function (req, res, next) {
    const parcelId = req.params.parcel_id
    let token = req.header('X-Auth-Token')
    let key = auth.getKey(token, configAuth.secret)

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

        files.deleteParcelInfo(parcelId)
        redis.remove(key)
        await s3Client.remove(minio.bucket_name, parcelId)

        res.status(204).json({});
    } catch (error) {
        /**
         * TODO
         * - redis remove 실패 시, db roll back 처리
         * - minio remove 실패 시, db 및 redis key roll back 처리
         */
        res = error.code ? res.status(error.code) : res
        res.status(error.code).json({"error": error.message})
    }
});

export default router;