
function loadSockets(io, conexion) // Se devuelve data.recordset !!!
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
                conexion.recHit('Hit', `SELECT ll.Llicencia, ll.Empresa, ll.LastAccess, we.Db FROM llicencies ll LEFT JOIN Web_Empreses we ON ll.Empresa = we.Nom WHERE ll.Llicencia = ${data.numLicencia}`).then(function(data){
                    if(data.recordset.length === 1)
                    {
                        conexion.recHit(data.recordset[0].Db, 'SELECT * FROM Clients').then((res)=>{
                            socket.emit('test', res.recordset);
                        });
                    }
                });
            }
        });

        /* OTRA */
    });
}
module.exports.loadSockets = loadSockets;