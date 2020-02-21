
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
                sql += `INSERT INTO ${data.nombreTabla} (Botiga, Data, Dependenta, Num_tick, Estat, Plu, Quantitat, Import, Tipus_venta, FormaMarcar, Otros) VALUES (${data.codigoTienda}, CONVERT(datetime, '${data.fecha}', 120), ${data.idDependienta}, ${data.idTicket}, '', ${data.cesta[i].idArticulo}, ${data.cesta[i].unidades}, ${data.cesta[i].subtotal}, '${data.tipoVenta}', 0, '');`;
            }

            conexion.recHit(data.database, sql).then(res => {
                let sql2 = `IF EXISTS (SELECT * FROM tocGame_idTickets WHERE licencia = ${data.licencia}) 
                            BEGIN
                            UPDATE tocGame_idTickets SET ultimoIdTicket = ${data.idTicket} WHERE licencia = ${data.licencia}
                            END
                            ELSE
                            BEGIN
                                INSERT INTO tocGame_idTickets (licencia, bbdd, ultimoIdTicket) VALUES (${data.licencia}, '${data.database}', ${data.idTicket})
                            END`;
                conexion.recHit('Hit', sql2).then(res2 => {
                    socket.emit('confirmarEnvioTicket', {
                        idTicket: data.idTicket,
                        respuestaSql: res
                    });
                });
            });
        });

        /* FIN GUARDAR TICKET */
        /* GUARDAR CAJAS */
        socket.on('guardar-caja', (data) => {
            for (let i = 0; i < data.arrayCajas.length; i++) {
                let fechaFinal = new Date(data.arrayCajas[i].finalTime);
                let fechaInicio = new Date(data.arrayCajas[i].inicioTime);

                let finalYear = `${fechaFinal.getFullYear()}`;
                let finalMonth = `${fechaFinal.getMonth() + 1}`;
                let finalDay = `${fechaFinal.getDate()}`;
                let finalHours = `${fechaFinal.getHours()}`;
                let finalMinutes = `${fechaFinal.getMinutes()}`;
                let finalSeconds = `${fechaFinal.getSeconds()}`;

                let inicioYear = `${fechaInicio.getFullYear()}`;
                let inicioMonth = `${fechaInicio.getMonth() + 1}`;
                let inicioDay = `${fechaInicio.getDate()}`;
                let inicioHours = `${fechaInicio.getHours()}`;
                let inicioMinutes = `${fechaInicio.getMinutes()}`;
                let inicioSeconds = `${fechaInicio.getSeconds()}`;

                let sumaEfectivoTarjetaTotal = data.arrayCajas[i].recaudado - data.arrayCajas[i].descuadre;
                let descuadre = data.arrayCajas[i].descuadre;
                let nClientes = data.arrayCajas[i].nClientes;

                if (finalMonth.length === 1) {
                    finalMonth = '0' + finalMonth;
                }
                if (finalDay.length === 1) {
                    finalDay = '0' + finalDay;
                }
                if (finalHours.length === 1) {
                    finalHours = '0' + finalHours;
                }
                if (finalMinutes.length === 1) {
                    finalMinutes = '0' + finalMinutes;
                }
                if (finalSeconds.length === 1) {
                    finalSeconds = '0' + finalSeconds;
                }
                //-------------------------------------
                if (inicioMonth.length === 1) {
                    inicioMonth = '0' + inicioMonth;
                }
                if (inicioDay.length === 1) {
                    inicioDay = '0' + inicioDay;
                }
                if (inicioHours.length === 1) {
                    inicioHours = '0' + inicioHours;
                }
                if (inicioMinutes.length === 1) {
                    inicioMinutes = '0' + inicioMinutes;
                }
                if (inicioMinutes.length === 1) {
                    inicioMinutes = '0' + inicioMinutes;
                }

                let sqlZGJ = '';
                let sqlW = '';
                let sqlWi = '';
                let sqlO = '';
                let nombreTabla = '[V_Moviments_' + finalYear + '-' + finalMonth + ']';

                sqlZGJ = `
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'Z', ${sumaEfectivoTarjetaTotal}, '');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'G', ${nClientes}, '');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'J', ${descuadre}, '');
                          `;

                sqlW = `
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[0].valor}, 'En : 0.01');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[1].valor}, 'En : 0.02');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[2].valor}, 'En : 0.05');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[3].valor}, 'En : 0.1');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[4].valor}, 'En : 0.2');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[5].valor}, 'En : 0.5');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[6].valor}, 'En : 1');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[7].valor}, 'En : 2');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[8].valor}, 'En : 5');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[9].valor}, 'En : 10');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[10].valor}, 'En : 20');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[11].valor}, 'En : 50');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[12].valor}, 'En : 100');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[13].valor}, 'En : 200');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${finalYear}-${finalMonth}-${finalDay} ${finalHours}:${finalMinutes}:${finalSeconds}', 120), ${data.arrayCajas[i].finalDependenta}, 'W', ${data.arrayCajas[i].detalleCierre[14].valor}, 'En : 500');
                        `;
                sqlWi = `
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[0].valor}, 'En : 0.01');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[1].valor}, 'En : 0.02');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[2].valor}, 'En : 0.05');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[3].valor}, 'En : 0.1');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[4].valor}, 'En : 0.2');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[5].valor}, 'En : 0.5');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[6].valor}, 'En : 1');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[7].valor}, 'En : 2');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[8].valor}, 'En : 5');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[9].valor}, 'En : 10');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[10].valor}, 'En : 20');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[11].valor}, 'En : 50');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[12].valor}, 'En : 100');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[13].valor}, 'En : 200');
                            INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${inicioYear}-${inicioMonth}-${inicioDay} ${inicioHours}:${inicioMinutes}:${inicioSeconds}', 120), ${data.arrayCajas[i].inicioDependenta}, 'Wi', ${data.arrayCajas[i].detalleApertura[14].valor}, 'En : 500');
                `;

                let sqlCompleta = sqlZGJ + sqlW + sqlWi;
                conexion.recHit(data.database, sqlCompleta).then(aux => {
                    socket.emit('confirmarEnvioCaja', {
                        idCaja: data.arrayCajas[i].id,
                        respuestaSql: aux
                    });
                });
            }
        });

        /* FIN GUARDAR CAJAS */
        /* COMPROBAR E INSTALAR LICENCIA */
        socket.on('install-licencia', (data) => {
            if (data.password == 'LOperas93786') {
                conexion.recHit('Hit', `SELECT ll.Llicencia, ll.Empresa, ll.LastAccess, we.Db, ti.ultimoIdTicket FROM llicencies ll LEFT JOIN Web_Empreses we ON ll.Empresa = we.Nom LEFT JOIN tocGame_idTickets ti ON ti.licencia = ${data.numLicencia} WHERE ll.Llicencia = ${data.numLicencia}`).then(function (data) {
                    conexion.recHit(data.recordset[0].Db, `SELECT Nom, Codi as codigoTienda FROM clients WHERE Codi = (SELECT Valor1 FROM ParamsHw WHERE Codi = ${data.recordset[0].Llicencia})`).then(data2 => {
                        if (data.recordset.length === 1) {
                            socket.emit('install-licencia', {
                                licencia: parseInt(data.recordset[0].Llicencia),
                                nombreEmpresa: data.recordset[0].Empresa,
                                database: data.recordset[0].Db,
                                error: false,
                                nombreTienda: data2.recordset[0].Nom,
                                codigoTienda: data2.recordset[0].codigoTienda,
                                ultimoTicket: data.recordset[0].ultimoIdTicket
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