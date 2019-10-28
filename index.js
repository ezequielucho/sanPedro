const path      = require('path');
const express   = require('express');
const conexion  = require('./conexion');   
const app       = express();

//SETTINGS
app.set('port', process.env.PORT || 8080);
//STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

//START SERVER
const server = app.listen(app.get('port'), () =>{
    console.log('server on port', app.get('port'));
});

//WEBSOCKETS
const socketIO = require('socket.io');
const io = socketIO(server);

io.on('connection', (socket)=>{
    console.log('Nueva conexión con ID' + socket.id);
    socket.on('eze-test', (data)=>{
        console.log("Mi primer web socket es: " + data);
        consultita = conexion.recHit('Fac_Demo', 'SELECT * FROM Clients');
        io.sockets.emit('escucho', consultita);
    });
});