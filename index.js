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

io.on('connection', (socket)=>
{
    socket.on('eze-test', (data)=>{
        conexion.recHit('Fac_Demo', 'SELECT * FROM Clients', io);
    });

    socket.on('install-licencia', (data)=>{
        if(data.password == 'LOperas93786')
        {
            console.log(conexion.recHit('Hit', `SELECT * FROM llicencies WHERE Llicencia = ${data.numLicencia}`, io));
            
        }
        console.log(data.numLicencia, data.password);
        //conexion.recHit('Fac_Demo', '', io);
    });

    //socket.on();
});