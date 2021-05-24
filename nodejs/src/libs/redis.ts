import redis from 'redis'

//export const redisClient = redis.createClient()
export var redisClient: redis.RedisClient

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
    return value;
  })
}
export default {
  save,
  remove,
  get
}
