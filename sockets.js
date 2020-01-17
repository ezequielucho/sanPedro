
function configurarTarifasEspeciales(articulos, arrayTarifasEspeciales) {
    if (arrayTarifasEspeciales.length > 0) /* APLICAR TARIFAS ESPECIALES */ {
        for (let i = 0; i < arrayTarifasEspeciales; i++) {
            for (let j = 0; j < articulos; j++) {
                if (articulos[j].id === arrayTarifasEspeciales[i].id) {
                    articulos[j].precioConIva = arrayTarifasEspeciales[i].precioConIva;
                    break;
                }
            }
        }
    }
    console.log(articulos)
    return articulos;
}

function loadSockets(io, conexion) // Se devuelve data.recordset !!!
{
    io.on('connection', (socket) => {
        /* TEST */
        socket.on('eze-test', (data) => {
            conexion.recHit('Fac_Demo', 'SELECT * FROM Clients').then(res => {
                console.log(res);
            });
        });
        /* COMPROBAR E INSTALAR LICENCIA */
        socket.on('install-licencia', (data) => {
            if (data.password == 'LOperas93786') {
                conexion.recHit('Hit', `SELECT ll.Llicencia, ll.Empresa, ll.LastAccess, we.Db FROM llicencies ll LEFT JOIN Web_Empreses we ON ll.Empresa = we.Nom WHERE ll.Llicencia = ${data.numLicencia}`).then(function (data) {
                    if (data.recordset.length === 1) {
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
                    else {
                        socket.emit('install-licencia', {
                            error: true,
                            infoError: "No hay UN resultado con estos datos"
                        });
                    }
                });
            }
            else {
                socket.emit('install-licencia', {
                    error: true,
                    infoError: "Contraseña incorrecta"
                });
            }
        });

        /* OTRA */
        socket.on('cargar-todo', (data) => {
            conexion.recHit(data.database, `SELECT Valor1 as codigoCliente FROM ParamsHw WHERE Codi = ${data.licencia}`).then(res8 => {
                let codigoCliente = res8.recordset.codigoCliente;
                console.log("Codigo cliente var = " + codigoCliente);
                if (res8) {
                    conexion.recHit(data.database, 'SELECT Codi as id, NOM as nombre, PREU as precioConIva, TipoIva as tipoIva, EsSumable as aPeso, Familia as familia FROM Articles').then(res2 => {
                        console.log("codigoCliente dentro de promesas = " + codigoCliente);
                        conexion.recHit(data.database, `SELECT Codi as id, PREU as precioConIva FROM TarifesEspecials WHERE TarifaCodi = (select [Desconte 5] from clients where Codi = ${codigoCliente}) AND TarifaCodi <> 0`).then(res7 => {
                            if (res7) {
                                console.log("Entra en if(res7)");
                                if (res7.recordset.length > 0) {
                                    res2.recordset = configurarTarifasEspeciales(res2.recordset, res7.recordset);
                                }
                                conexion.recHit(data.database, `SELECT DISTINCT Ambient as nomMenu FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then(res1 => {
                                    if (res1) {
                                        conexion.recHit(data.database, `SELECT Data, Ambient as nomMenu, article as idArticle, pos, color FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then((res) => {
                                            if (res) {
                                                conexion.recHit(data.database, 'select Codi as idTrabajador, nom as nombre, memo as nombreCorto from dependentes').then(res3 => {
                                                    if (res3) {
                                                        conexion.recHit(data.database, 'SELECT Nom as nombre, Pare as padre FROM Families WHERE Nivell > 0').then(res4 => {
                                                            if (res4) { //Esta consulta debería buscar el codigo de cliente en el paramsHw, según la licencia data.licencia
                                                                let sqlPromos = `SELECT Id as id, Di as fechaInicio, Df as fechaFinal, D_Producte as principal, D_Quantitat as cantidadPrincipal, S_Producte as secundario, S_Quantitat as cantidadSecundario, S_Preu as precioFinal FROM ProductesPromocionats WHERE Client = ${data.licencia}`;// AND Df > GETDATE()`;
                                                                conexion.recHit(data.database, sqlPromos).then(res5 => {
                                                                    if (res5) {
                                                                        conexion.recHit(data.database, "select Id as id, Nom as nombre, IdExterna as tarjetaCliente from ClientsFinals WHERE Id IS NOT NULL AND Id <> ''").then(res6 => {
                                                                            if (res6) {
                                                                                let auxObject = {
                                                                                    error: false,
                                                                                    menus: res1.recordset,
                                                                                    teclas: res.recordset,
                                                                                    articulos: res2.recordset,
                                                                                    dependentes: res3.recordset,
                                                                                    familias: res4.recordset,
                                                                                    promociones: res5.recordset,
                                                                                    clientes: res6.recordset,
                                                                                    sql: sqlPromos
                                                                                };
                                                                                socket.emit('cargar-todo', auxObject);
                                                                            }
                                                                            else {
                                                                                socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL 6" });
                                                                            }
                                                                        });
                                                                    }
                                                                    else {
                                                                        socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL 5" });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                socket.emit('cargar-todo', { error: true, infoError: 'Error en la respuesta de la consulta 4' });
                                                            }
                                                        });
                                                    }
                                                    else {
                                                        socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL 3" });
                                                    }
                                                });
                                            }
                                            else {
                                                socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL" });
                                            }
                                        });
                                    }
                                    else {
                                        socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL 1" });
                                    }
                                });
                            }
                            else {
                                socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL 7" });
                            }
                        });
                    });
                }
                else {
                    socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL 8" });
                }
            });
        });
    });
}
module.exports.loadSockets = loadSockets;