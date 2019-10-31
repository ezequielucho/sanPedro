
function loadSockets(socket, conexion)
{
    socket.on('eze-test', (data)=>{
        conexion.recHit('Fac_Demo', 'SELECT * FROM Clients');
    });

    socket.on('install-licencia', (data)=>{
        if(data.password == 'LOperas93786')
        {
            conexion.recHit('Hit', `SELECT * FROM llicencies WHERE Llicencia = ${data.numLicencia}`).then(function(data){
                console.log(data);
            });
            
        }
        console.log(data.numLicencia, data.password);
        //conexion.recHit('Fac_Demo', '', io);
    });
}
module.exports.loadSockets = loadSockets;