import Stream from 'stream'

import Minio, {Client} from 'minio'
import {MinIoErrorCode} from './exception'
import config from 'config'

const configMinio: any = config.get('mino')
export let client: Client

function connect(endPoint: string, port: number, useSSL: boolean, accessKey: string, secretKey: string) {
  try {
    client = new Minio.Client({
      endPoint: endPoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey
    });
  } catch(error) {
    throw new Error(`Minio Connect Error: ${error}: ${MinIoErrorCode.ERR_CONNECT_MINIO}`)
  }
}

async function upload(parcelId: string, buffer: Buffer, size: number) {
  return client.putObject(configMinio.bucket_name, parcelId, buffer, size)
}

async function download(bucketName:string = configMinio.bucket_name, parcelId: string) {
  return client.getObject(bucketName, parcelId)
}

async function remove(bucketName:string = configMinio.bucket_name, parcelId: string) {
  return client.removeObject(bucketName, parcelId)
}

async function existsBucket(bucketName: string = configMinio.bucket_name) {
  const exists = await client.bucketExists(bucketName)
  if (!exists) {
    throw {
      code: 601,
      message: `Bucket is None: ${MinIoErrorCode.ERR_NONE_BUCKET}`
    }
  }
}

async function existsObject(bucketName: string = configMinio.bucket_name, objectName: string) {
  const stream = await client.getObject(bucketName, objectName)

  if (stream) {
    throw {
      code: 606,
      message: `Value for Key ${objectName} is already exist: ${MinIoErrorCode.ERR_ALREADY_EXIST}`
    }
  }
}

export default {
  connect,
  upload,
  download,
  remove,
  existsBucket,
  existsObject
}