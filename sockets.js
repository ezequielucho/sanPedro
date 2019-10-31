
function loadSockets(io, conexion)
{
    io.on('connection', (socket)=>
    {    
        /* TEST */
        socket.on('eze-test', (data)=>{
            conexion.recHit('Fac_Demo', 'SELECT * FROM Clients');
        });
        /* COMPROBAR E INSTALAR LICENCIA */
        socket.on('install-licencia', (data)=>{
            if(data.password == 'LOperas93786')
            {
                conexion.recHit('Hit', `SELECT * FROM llicencies WHERE Llicencia = ${data.numLicencia}`).then(function(data){
                    socket.emit('test', data);
                });
            }
            console.log(data.numLicencia, data.password);
            //conexion.recHit('Fac_Demo', '', io);
        });

        /* OTRA */
    });
}
module.exports.loadSockets = loadSockets;