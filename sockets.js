
function configurarTarifasEspeciales(articulos, arrayTarifasEspeciales) {
    if (arrayTarifasEspeciales.length > 0) /* APLICAR TARIFAS ESPECIALES */ {
        for (let i = 0; i < arrayTarifasEspeciales.length; i++) {
            for (let j = 0; j < articulos.length; j++) {
                if (articulos[j].id === arrayTarifasEspeciales[i].id) {
                    articulos[j].precioConIva = arrayTarifasEspeciales[i].precioConIva;
                    break;
                }
            }
        }
    }
    return articulos;
}

function loadSockets(io, conexion) // Se devuelve data.recordset !!!
{
    io.on('connection', (socket) => {
        /* TEST */
        socket.on('eze-test', (data) => {
            conexion.recHit('Fac_', 'SELECT * FROM Clients').then(res => {
                console.log(res);
            });
        });
        /* GUARDAR TICKET */
        socket.on('guardar-ticket', (data) => {
            let sql = '';
            for (let i = 0; i < data.cesta.length; i++) {
                sql = `INSERT INTO ${data.nombreTabla} (Botiga, Data, Dependenta, Num_tick, Estat, Plu, Quantitat, Import, Tipus_venta, FormaMarcar, Otros) VALUES (${data.codigoTienda}, CONVERT(datetime, '${data.fecha}', 127), ${data.idDependienta}, ${data.idTicket}, '', ${data.cesta[i].idArticulo}, ${data.cesta[i].unidades}, ${data.cesta[i].subtotal}, '${data.tipoVenta}', 0, '')`;
            }
            conexion.recHit(data.database, sql).then(res => {
                console.log('Ticket guardado');
            });

            console.log(data);
        });
        /* FIN GUARDAR TICKET */
        /* COMPROBAR E INSTALAR LICENCIA */
        socket.on('install-licencia', (data) => {
            if (data.password == 'LOperas93786') {
                conexion.recHit('Hit', `SELECT ll.Llicencia, ll.Empresa, ll.LastAccess, we.Db FROM llicencies ll LEFT JOIN Web_Empreses we ON ll.Empresa = we.Nom WHERE ll.Llicencia = ${data.numLicencia}`).then(function (data) {
                    conexion.recHit(data.recordset[0].Db, `SELECT Nom, Codi as codigoTienda FROM clients WHERE Codi = (SELECT Valor1 FROM ParamsHw WHERE Codi = ${data.recordset[0].Llicencia})`).then(data2 => {
                        if (data.recordset.length === 1) {
                            socket.emit('install-licencia', {
                                licencia: parseInt(data.recordset[0].Llicencia),
                                nombreEmpresa: data.recordset[0].Empresa,
                                database: data.recordset[0].Db,
                                error: false,
                                nombreTienda: data2.recordset[0].Nom,
                                codigoTienda: data2.recordset[0].codigoTienda
                            });
                        }
                        else {
                            socket.emit('install-licencia', {
                                error: true,
                                infoError: "No hay UN resultado con estos datos"
                            });
                        }
                    });
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
                let codigoCliente = res8.recordset[0].codigoCliente;
                if (res8) {
                    conexion.recHit(data.database, 'SELECT Codi as id, NOM as nombre, PREU as precioConIva, TipoIva as tipoIva, EsSumable as aPeso, Familia as familia, ISNULL(PreuMajor, 0) as precioBase FROM Articles').then(res2 => {
                        conexion.recHit(data.database, `SELECT Codi as id, PREU as precioConIva FROM TarifesEspecials WHERE TarifaCodi = (select [Desconte 5] from clients where Codi = ${codigoCliente}) AND TarifaCodi <> 0`).then(res7 => {
                            if (res7) {
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
                                                                        conexion.recHit(data.database, `select Variable AS nombreDato, Valor AS valorDato from paramsTpv where CodiClient = ${codigoCliente} AND (Variable = 'Capselera_1' OR Variable = 'Capselera_2')`).then(res10 => {
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
                                                                                        parametrosTicket: res10.recordset,
                                                                                        sql: sqlPromos
                                                                                    };
                                                                                    socket.emit('cargar-todo', auxObject);
                                                                                }
                                                                                else {
                                                                                    socket.emit('cargar-todo', { error: true, infoError: "Error en la respuesta de la consulta SQL 6" });
                                                                                }
                                                                            });
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