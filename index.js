const path      = require('path');
const express   = require('express');
const conexion  = require('./conexion');  
const modSocket = require('./sockets');
const app       = express();

//SETTINGS
app.set('port', process.env.PORT || 8080);
app.set('Content-Type', 'text/plain');
//STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

//START SERVER
const server = app.listen(app.get('port'), () =>{
    console.log('server on port', app.get('port'));
});

//WEBSOCKETS
const socketIO = require('socket.io');
const io = socketIO(server);

modSocket.loadSockets(io, conexion);