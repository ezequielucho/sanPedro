
function loadSockets(io, conexion) // Se devuelve data.recordset !!!
{
    io.on('connection', (socket)=>
    {    
        /* TEST */
        socket.on('eze-test', (data)=>{
            conexion.recHit('Fac_Demo', 'SELECT * FROM Clients').then(res=>{
                console.log(res);
            });
        });
        /* COMPROBAR E INSTALAR LICENCIA */
        socket.on('install-licencia', (data)=>{
            if(data.password == 'LOperas93786')
            {
                conexion.recHit('Hit', `SELECT ll.Llicencia, ll.Empresa, ll.LastAccess, we.Db FROM llicencies ll LEFT JOIN Web_Empreses we ON ll.Empresa = we.Nom WHERE ll.Llicencia = ${data.numLicencia}`).then(function(data){
                    if(data.recordset.length === 1)
                    {
                        /*
                        conexion.recHit(data.recordset[0].Db, 'SELECT * FROM Clients').then((res)=>{
                            socket.emit('test', res.recordset);
                        });
                        */
                       socket.emit('install-licencia', {
                           licencia: parseInt(data.recordset[0].Llicencia), 
                           nombreEmpresa: data.recordset[0].Empresa,
                           database: data.recordset[0].Db,
                           error: false
                        });
                    }
                    else
                    {
                        socket.emit('install-licencia', {
                            error: true,
                            infoError: "No hay UN resultado con estos datos"
                         });
                    }
                });
            }
            else
            {
                socket.emit('install-licencia', {
                    error: true,
                    infoError: "Contraseña incorrecta"
                 });
            }
        });

        /* OTRA */
        socket.on('cargar-ultimo-teclado', (data)=>{
            console.log("Recibo petición ", data);
            conexion.recHit(data.database, 'SELECT Codi as id, NOM as nombre, PREU as precioConIva, TipoIva as tipoIva FROM Articles').then(res2=>{
                conexion.recHit(data.database, `SELECT DISTINCT Ambient as nomMenu FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then(res1=>{
                    if(res1)
                    {
                        conexion.recHit(data.database, `SELECT Data, Ambient as nomMenu, article as idArticle, pos, color FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then((res)=>{
                            if(res)
                            {
                                let auxObject = {
                                    error: false,
                                    menus: res1.recordset,
                                    teclas: res.recordset,
                                    articulos: res2.recordset
                                };
                                console.log("Voy a emitir esto: ", auxObject);
                                socket.emit('cargar-ultimo-teclado', auxObject);
                            }
                            else
                            {
                                socket.emit('cargar-ultimo-teclado', {error: true, infoError: "Error en la respuesta de la consulta SQL"});
                            }
                        });
                    }
                    else
                    {
                        socket.emit('cargar-ultimo-teclado', {error: true, infoError: "Error en la respuesta de la consulta SQL 1"});
                    }
                });
            });
        });
    });
}
module.exports.loadSockets = loadSockets;