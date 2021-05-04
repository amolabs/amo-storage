import http from 'http';
import express from 'express';
import logger from 'morgan';
import cors from 'cors';

import router from './router';

const serverPort = 8080

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);

const app = express();
app.use(logger('short'));
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ limit: Infinity })); // TODO: fix max limit for raw data
app.use(express.text({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: false }));
app.use(cors({origin: '*', optionsSuccessStatus: 200}));

app.use('/', router)

app.set('port', serverPort);

const server = http.createServer(app);
server.listen(serverPort, '127.0.0.1');
server.on('listening', onListening);
server.on('close', onClose);
server.on('error', onError);

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof serverPort === 'string'
  ? 'Pipe ' + serverPort
  : 'Port ' + serverPort;

  // handle specific listen errors with friendly messages
  switch (error.code) {
  case 'EACCES':
    console.error(bind + ' requires elevated privileges');
    process.exit(1);
  case 'EADDRINUSE':
    console.error(bind + ' is already in use');
    process.exit(1);
  default:
    throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
  ? 'pipe ' + addr
  : 'port ' + addr?.port;
  // TODO: proper logging
  console.log(`Listening on ${bind}`);
}

function onClose() {
  console.log(`Server closed.`);
}

function shutDown(sig: any) {
  console.log(`\nA signal ${sig} received. Closing server.`);
  if (server.listening) {
    server.close();
  }
}
