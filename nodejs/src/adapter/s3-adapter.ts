import {BucketItemStat, Client} from 'minio'
import {MinIoErrorCode} from './exception'
import config from 'config'

const configMinio: any = config.get('minio')
export let client: Client

function connect(endPoint: string, port: number, useSSL: boolean, accessKey: string, secretKey: string) {
  try {
    client = new Client({
      endPoint: endPoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey
    });
  } catch(error) {
    console.log(error)
    throw new Error(`Minio Connect Error: ${error}: ${MinIoErrorCode.ERR_CONNECT_MINIO}`)
  }
}

async function createBucket(bucketName: string, region: string = 'Seoul') {
  return client.makeBucket(bucketName, region)
}

async function upload(parcelId: string, buffer: Buffer, size: number, metadata: object) {
  await existsBucket(configMinio.bucket_name)
  await alreadyExistsObject(configMinio.bucket_name, parcelId)
  return client.putObject(configMinio.bucket_name, parcelId, buffer, size, metadata)
}

async function download(bucketName:string = configMinio.bucket_name, parcelId: string) {
  return client.getObject(bucketName, parcelId)
}

async function remove(bucketName:string = configMinio.bucket_name, parcelId: string) {
  return client.removeObject(bucketName, parcelId)
}

async function existsBucket(bucketName: string, result?: boolean) {
  try {
    const exists = await client.bucketExists(bucketName)
    if (result) {
      return Promise.resolve(exists)
    } else {
      if (exists) {
        return Promise.resolve(exists)
      } else {
        return Promise.reject({
          code: 601,
          message: `Bucket is None: ${MinIoErrorCode.ERR_NONE_BUCKET}`
        })
      }
    }
  } catch(error) {
    return Promise.reject(error)
  }
}

async function getObjectMetadata(bucketName: string, objectName: string) {
  try {
    const itemStat: BucketItemStat = await client.statObject(bucketName, objectName)
    return Promise.resolve(itemStat.metaData)
  } catch (error) {
    if (error.code == 'NotFound') {
      return Promise.reject({
        code: MinIoErrorCode.ERR_NOT_FOUND,
        message: `Metadata for Key ${objectName} is Not Found`
      })
    }
    return Promise.reject(error)
  }
}

async function alreadyExistsObject(bucketName: string, objectName: string) {
  try {
    const stream = await client.getObject(bucketName, objectName)

    if (stream) {
      return Promise.reject({
        code: MinIoErrorCode.ERR_ALREADY_EXIST,
        message: `Value for Key ${objectName} is already exist`
      })
    }
  } catch (error) {
    if (error.code == 'NoSuchKey') {
      return Promise.resolve();
    } else {
      return Promise.reject(error)
    }
  }
}

async function existsObject(bucketName: string, objectName: string, result?: boolean) {
  try {
    const stream = await client.getObject(bucketName, objectName)

    return Promise.resolve(true)
  } catch (error) {
    if (error.code == 'NoSuchKey') {
      if (result) {
        return Promise.resolve(false)
      } else {
        return Promise.reject({
          code: MinIoErrorCode.ERR_NOT_FOUND,
          message: `Value for Key ${objectName} is Not Found`
        })
      }
    } else {
      return Promise.reject(error)
    }
  }
}

export default {
  connect,
  createBucket,
  upload,
  download,
  remove,
  existsBucket,
  alreadyExistsObject,
  getObjectMetadata,
  existsObject
}