import {Client} from 'minio'
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

async function upload(parcelId: string, buffer: Buffer, size: number) {
  await existsBucket(configMinio.bucket_name)
  await existsObject(configMinio.bucket_name, parcelId)
  return client.putObject(configMinio.bucket_name, parcelId, buffer, size)
}

async function download(bucketName:string = configMinio.bucket_name, parcelId: string) {
  return client.getObject(bucketName, parcelId)
}

async function remove(bucketName:string = configMinio.bucket_name, parcelId: string) {
  return client.removeObject(bucketName, parcelId)
}

async function existsBucket(bucketName: string, result?: boolean) {
  const exists = await client.bucketExists(bucketName)
  if (result) {
    return exists
  } else {
    if (exists) {
      return exists
    } else {
      throw {
        code: 601,
        message: `Bucket is None: ${MinIoErrorCode.ERR_NONE_BUCKET}`
      }
    }
  }
}

async function existsObject(bucketName: string, objectName: string) {
  try {
    const stream = await client.getObject(bucketName, objectName)

    if (stream) {
      Promise.reject({
        code: 606,
        message: `Value for Key ${objectName} is already exist: ${MinIoErrorCode.ERR_ALREADY_EXIST}`
      })
    }
  } catch (error) {
    if (error.code == 'NoSuchKey') {
      return Promise.resolve();
    } else {
      Promise.reject(error)
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
  existsObject
}