import express, {NextFunction, Request, Response} from 'express'
import redis from "../libs/redis"
import config from 'config'
import multer from 'multer'
import s3Client from '../adapter/s3-adapter'
import auth from '../libs/auth'
import rpc from '../libs/rpc'
import {validateFormData} from "../middleware/validate"
import {verifyAuthRequired} from "../middleware/verify"
import utils from '../libs/utils'
import Stream from "node:stream"

const storage: any = config.get('storage')
const minio: any = config.get('minio')
const configAuth: any = config.get('auth')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/', verifyAuthRequired, upload.single('file'), async function (req, res, next) {
  try {
    validateFormData(req)
    let owner: string = req.body.owner
    let metadata: string = req.body.metadata
    // let file = req.file
    const file = req.file ? req.file.buffer : req.body.file
    const size = req.file ? req.file.size : 0
    let localId = utils.createParcelId(owner, metadata, file)
    let parcelId = `${storage.storage_id}${localId}`

    const existsMetadata = await s3Client.existsObject(minio.bucket_name, parcelId, true)

    if(existsMetadata){
        return res.json({"id": parcelId})
    }

    await s3Client.upload(parcelId, file, size, JSON.parse(metadata))
    console.log("# parcelId:", parcelId)
    res.json({"id": parcelId})
  } catch (error) {
    console.log("#upload error", error)
    utils.decorateErrorResponse(res, error).json({"error": error.message})
  }
})

router.get('/:parcel_id([a-zA-Z0-9]+)', verifyAuthRequired, async function (req, res, next) {
  const parcelId = req.params.parcel_id
  const key = req.query.key

  try {
      const metadata: any = await s3Client.getObjectMetadata(minio.bucket_name, parcelId)
      if (key == 'metadata') {
          res.json({"metadata": metadata})
      } else if (key == 'owner') {
          res.json({"owner": metadata.owner})
      } else {
          throw {
              code: 400,
              message: "Query key is invalid."
          }
      }
  } catch (error) {
      utils.decorateErrorResponse(res, error).json({"error": error.message})
  }
})

router.get('/download/:parcel_id([a-zA-Z0-9]+)', verifyAuthRequired, async function (req: Request, res: Response, next: NextFunction) {
  const parcelId = req.params.parcel_id
  console.log("# download")
  try {
      const metadata: any = await s3Client.getObjectMetadata(minio.bucket_name, parcelId)

      if (req.user != metadata.owner) {
          let result: any = await rpc.usageQuery(parcelId, req.user)

          if (result.data.result.response.code != 0) {
              throw {
                  code: 403,
                  message: `No permission to download data parcel ${parcelId}`
              }
          }
      }
      await s3Client.existsBucket(minio.bucket_name)
      await s3Client.existsObject(minio.bucket_name, parcelId)
      let stream: Stream = await s3Client.download(minio.bucket_name, parcelId)
      const data: string = await utils.streamToString(stream)

      _deleteKey(req)

      res.json({
          "id": parcelId,
          "owner": metadata.owner,
          "metadata": metadata,
          "data": data})
  } catch (error) {
      utils.decorateErrorResponse(res, error).json({"error": error.message})
  }
})

router.delete('/:parcel_id([a-zA-Z0-9]+)', verifyAuthRequired, async function (req, res, next) {
  const parcelId = req.params.parcel_id
  let token = req.header('X-Auth-Token')
  let key = auth.getTokenKey(token, configAuth.secret)

  try {
      const metadata: any = await s3Client.getObjectMetadata(minio.bucket_name, parcelId)
      if (req.user != metadata.owner) {
          throw {
              code: 405,
              message: "Not allowed to remove parcel"
          }
      }

      await s3Client.remove(minio.bucket_name, parcelId)
      redis.remove(key)

      res.status(204).json({})
  } catch (error) {
      utils.decorateErrorResponse(res, error).json({"error": error.message})
  }
})

function _deleteKey(req: Request) {
  let token = req.header('X-Auth-Token')
  let key = auth.getTokenKey(token, configAuth.secret)
  redis.remove(key)
}

export default router
