import * as os from "os"
import http from 'http'
import express from 'express'
import logger from 'morgan'
import cors from 'cors'
import config from 'config'
import indexRouter from './router'
import dotenv from 'dotenv'
import db from './libs/db'
import s3Client, {client} from "./adapter/s3-adapter"

const osType = os.type()
const serverIp: number = config.get('ip')
const serverPort: number = config.get('port')
const configDotenv: any = config.get('dotenv')
const dotenvPath = process.env.dotenv_path ?
    process.env.dotenv_path : (osType == 'Windows_NT' ? configDotenv.win_path : configDotenv.posix_path)
const minio: any = config.get('minio')
dotenv.config({path: dotenvPath})
const accessKey: any = process.env.accessKey ? process.env.accessKey : minio.access_key
const secretKey: any = process.env.secretKey ? process.env.secretKey : minio.secret_key
// DB가 필요할 경우 사용
// const dbConn = db.init()
// db.createTable(dbConn)

if (!client) {
  s3Client.connect(minio.end_point,
      minio.port,
      minio.use_ssl,
      accessKey,
      secretKey);
  s3Client
    .existsBucket(minio.bucket_name, true)
    .then(exists => {
      if (!exists) {
        s3Client.createBucket(minio.bucket_name)
      }
    })
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production"
}

process.on('SIGINT', shutDown)
process.on('SIGTERM', shutDown)

const app = express()

if (process.env.NODE_ENV === 'production') {
  app.use(logger('combined'))
} else {
  app.use(logger('dev'))
}

app.use(express.json({ limit: '10mb' }))
app.use(express.raw({ limit: Infinity })) // TODO: fix max limit for raw data
app.use(express.text({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: false }))
app.use(cors({origin: '*', optionsSuccessStatus: 200}))

app.use('/', indexRouter)

app.set('port', serverPort)

const server = http.createServer(app)
server.listen(serverPort, serverIp)
server.on('listening', onListening)
server.on('close', onClose)
server.on('error', onError)

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof serverPort === 'string'
  ? 'Pipe ' + serverPort
  : 'Port ' + serverPort

  // handle specific listen errors with friendly messages
  switch (error.code) {
  case 'EACCES':
    console.error(bind + ' requires elevated privileges')
    process.exit(1)
  case 'EADDRINUSE':
    console.error(bind + ' is already in use')
    process.exit(1)
  default:
    throw error
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  let addr: any = server.address()

  // TODO: proper logging
  console.log(`Listening on ${addr.address}:${addr.port}`)
}

function onClose() {
  console.log(`Server closed.`)
}

function shutDown(sig: any) {
  console.log(`\nA signal ${sig} received. Closing server.`)
  if (server.listening) {
    console.log('Closed server')
    server.close()
  }
}
