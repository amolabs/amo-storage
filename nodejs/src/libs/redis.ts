import redis from 'redis'
import config from 'config'
import auth from './auth'
import {promisify} from 'util'

const configRedis: any = config.get('redis')
const host = configRedis.get('host')
const port = configRedis.get('port')
export const redisClient = redis.createClient(port, host)

function save(key: string, value: string) {
  try {
    redisClient.set(key, value)
  } catch (error) {
    throw {
      code: 500,
      message: "Save key failed"
    }
  }
}

function remove(key: string) {
  try {
    redisClient.del(key)
  } catch (error) {
    throw {
      code: 500,
      message: "Delete key failed"
    }
  }
}

async function get(key: string) {
  const getAsync = promisify(redisClient.get).bind(redisClient);

  return getAsync(key)
}

async function existsToken(token: string = '', secret: string) {
  let key = auth.getTokenKey(token, secret)
  return get(key)
}

export default {
  save,
  remove,
  get,
  existsToken
}