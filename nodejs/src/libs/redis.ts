import redis from 'redis'
import config from 'config'

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

function get(key: string) {
  return redisClient.get(key, (err, value) => {
    if (err) {
      throw {
        code: 500,
        message: "Delete key failed"
      }
    }
    return value
  })
}
export default {
  save,
  remove,
  get
}