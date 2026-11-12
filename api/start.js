#!/usr/bin/env node
require('dotenv-flow').config({ path: '../' })

var app = require('./app')
var http = require('http')

var port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

var server = http.createServer(app)

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

process.on('unhandledRejection', error => {
  console.error('unhandledRejection: ' + error.toString())
  server.close(() => {
    process.exit(1)
  })
})

function normalizePort (val) {
  var port = parseInt(val, 10)

  if (isNaN(port)) {
    return val
  }

  if (port >= 0) {
    return port
  }

  return false
}

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port

  // handle specific listen errors with friendly messages
  if (error.code === 'EACCES') {
    console.error(bind + ' requires elevated privileges')
    process.exit(1)
  } else if (error.code === 'EADDRINUSE') {
    console.error(bind + ' is already in use')
    process.exit(1)
  } else {
    throw error
  }
}

function onListening () {
  var addr = server.address()
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port
  console.log('listening on ' + bind)
}
