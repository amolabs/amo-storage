const appName = 'amo-storage';

import Minio, {Client} from 'minio'
import {MinIoErrorCode} from './exception'
import Buffer from 'multer'
import _config from 'config'
const config: any = _config.get(appName)
export let minioClient: Client

function connect(endPoint: string, port: number, useSSL: boolean, accessKey: string, secretKey: string) {
    try {
        minioClient = new Minio.Client({
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
    try {
        await _existsBucket(config.minio.bucket_name)
        await _existsObject(config.minio.bucket_name, parcelId)

        return new Promise((resolve, reject) => {
            return minioClient.putObject(config.minio.bucket_name, parcelId, buffer, size, (error, objInfo) => {
                if (error) {
                    return reject(`Minio Upload error: ${error}: ${MinIoErrorCode.ERR_S3_INTERNAL}`)
                }
                return resolve(objInfo)
            })
        })
    } catch (error) {
        throw error
    }
}

async function download(bucketName:string = config.minio.bucket_name, parcelId: string) {
    try {
        await _existsBucket(bucketName)
        await _existsObject(bucketName, parcelId)
        return _getObject(bucketName, parcelId)
    } catch (error) {
        throw error
    }
}

async function remove(bucketName:string = config.minio.bucket_name, parcelId: string) {
    try {
        await _existsBucket(bucketName)
        return new Promise<void>((resolve, reject) => {
            return minioClient.removeObject(bucketName, parcelId, error => {
                if (error) {
                    return reject(`Minio Remove error: ${error}: ${MinIoErrorCode.ERR_S3_INTERNAL}`)
                }
                return resolve()
            })
        })
    } catch (error) {
        throw error
    }
}

function _existsBucket(bucketName: string = config.minio.bucket_name) {
    return new Promise((resolve, reject) => {
        return minioClient.bucketExists(bucketName, (error, exists) => {
            if (error) {
                return reject(`bucketExists Error: ${error}: ${MinIoErrorCode.ERR_S3_INTERNAL}`)
            }
            if (!exists) {
                return reject(`Bucket is None: ${MinIoErrorCode.ERR_NONE_BUCKET}`)
            }
            return resolve(exists)
        })
    })

}

function _existsObject(bucketName: string = config.minio.bucket_name, objectName: string) {
    return _getObject(bucketName, objectName)
}

function _getObject(bucketName: string, objectName: string) {
    return new Promise((resolve, reject) => {
        return minioClient.getObject(bucketName, objectName, (error, dataStream) => {
            if (error) {
                return reject(`getObject Error: ${error}: ${MinIoErrorCode.ERR_S3_INTERNAL}`)
            }
            if (dataStream) {
                return reject(`Value for Key ${objectName} is already exist: ${MinIoErrorCode.ERR_ALREADY_EXIST}`)
            }
            return resolve(dataStream)
        } )
    })
}
export default {
    connect,
    upload,
    download,
    remove
}