
function configurarTarifasEspeciales(articulos, arrayTarifasEspeciales) {
    if (arrayTarifasEspeciales.length > 0) /* APLICAR TARIFAS ESPECIALES */ {
        for (let i = 0; i < arrayTarifasEspeciales.length; i++) {
            for (let j = 0; j < articulos.length; j++) {
                if (articulos[j]._id === arrayTarifasEspeciales[i].id) {
                    articulos[j].precioConIva = arrayTarifasEspeciales[i].precioConIva;
                    break;
                }
            }
        }
    }
    return articulos;
}

function configurarTarifasEspecialesViejo(articulos, arrayTarifasEspeciales) {
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
function sincronizarClientes(io) {
    io.emit('ordenSincronizarTodo', 'Sincronizar tocGame con BBDD WEB');
}
async function familiasPorObjetos(res5, database, codigoCliente, conexion)
{
    let objPrincipal    = null;
    let objSecundario   = null;
    for(let i = 0; i < res5.recordset.length; i++)
    {
        if(res5.recordset[i].principal.startsWith('F_'))
        {
            objPrincipal = await conexion.recHit(database, `select Codi as _id from articles where familia = '${res5.recordset[i].principal.substring(2)}'`);
            res5.recordset[i].principal = objPrincipal.recordset;
        }
        else
        {
            res5.recordset[i].principal = [{_id: Number(res5.recordset[i].principal)}]
        }

        if(res5.recordset[i].secundario.startsWith('F_'))
        {
            objSecundario = await conexion.recHit(database, `select Codi as _id from articles where familia = '${res5.recordset[i].secundario.substring(2)}'`);
            res5.recordset[i].secundario = objSecundario.recordset;
        }
        else
        {
            res5.recordset[i].secundario = [{_id: Number(res5.recordset[i].secundario)}]
        }
        objPrincipal    = null;
        objSecundario   = null;
    }
    console.log(res5);
    return res5;
}
function loadSockets(io, conexion) // Se devuelve data.recordset !!!
{
    //setInterval(sincronizarClientes, 7200000, io);
    io.on('connection', (socket) => {
        /* TEST */
        socket.on('eze-test', (data) => {
            var testSQL =
                `
                DECLARE @ultimaFecha datetime
                DECLARE @ultimaFechaApuntada datetime
                SELECT @ultimaFecha = MAX(Fecha) FROM GDT_StPedro WHERE tipo = 'Articles' and Empresa = 'Fac_Tena'
                IF EXISTS (SELECT * FROM ultimasSanpedro WHERE licencia = 819 and Articulos IS NOT NULL) 
                BEGIN
                    SELECT @ultimaFechaApuntada = articulos FROM ultimasSanpedro WHERE licencia = 819
                    IF @ultimaFecha > @ultimaFechaApuntada
                    BEGIN
                        UPDATE ultimasSanpedro SET articulos = GETDATE() WHERE licencia = 819
                        SELECT 'Hay que actualizar' as resultado
                    END
                    ELSE
                    BEGIN
                        SELECT 'Nada que hacer' as resultado
                    END
                END
                ELSE
                BEGIN
					IF EXISTS (SELECT * FROM ultimasSanpedro WHERE licencia = 819)
					BEGIN
						UPDATE ultimasSanpedro SET articulos = @ultimaFecha WHERE licencia = 819
					END
					ELSE
					BEGIN
						INSERT INTO ultimasSanpedro (empresa, licencia, articulos) VALUES ('Fac_Tena', 819, @ultimaFecha)
					END
					SELECT 'Hay que actualizar' as resultado
                END
            `;
            conexion.recHit('Hit', testSQL).then(res => {
                console.log('La última fecha es: ', res);
            });
        });

        socket.on('sincronizar-tickets-tocgame', data=>{
            for(let j = 0; j < data.arrayTickets.length; j++)
            {
                let sql = '';
                let campoOtros = '';
                let fechaTicket = Date(data.arrayTickets[j].timestamp);
                let mesBonito = fechaTicket.getMonth().toString();
                if(mesBonito.length < 2)
                {
                    mesBonito = '0'+ mesBonito;
                }
                let nombreTabla = `[V_Venut_${fechaTicket.getFullYear()}-${mesBonito}]`;
                for (let i = 0; i < data.arrayTickets[j].lista.length; i++)
                {
                    if (data.arrayTickets[j].tarjeta)
                    {
                        campoOtros = '[Visa]';
                    }
                    else 
                    {
                        campoOtros = '';
                    }
                    
                    sql += `INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Num_tick, Estat, Plu, Quantitat, Import, Tipus_venta, FormaMarcar, Otros) VALUES (${data.parametros.codigoTienda}, CONVERT(datetime, '${year}-${month}-${day} ${hours}:${minutes}:${seconds}', 120), ${data.arrayTickets[j].idTrabajador}, ${data.arrayTickets[j]._id}, '', ${data.arrayTickets[j].lista[i].idArticulo}, ${data.arrayTickets[j].lista[i].unidades}, ${data.arrayTickets[j].lista[i].subtotal}, 'V', 0, '${campoOtros}');`;
                }
    
                conexion.recHit(data.parametros.database, sql).then(res => {
                    let sql2 = `IF EXISTS (SELECT * FROM tocGame_idTickets WHERE licencia = ${data.parametros.licencia}) 
                                BEGIN
                                UPDATE tocGame_idTickets SET ultimoIdTicket = ${data.arrayTickets[j]._id} WHERE licencia = ${data.parametros.licencia}
                                END
                                ELSE
                                BEGIN
                                    INSERT INTO tocGame_idTickets (licencia, bbdd, ultimoIdTicket) VALUES (${data.parametros.licencia}, '${data.parametros.database}', ${data.arrayTickets[j]._id})
                                END`;
                    conexion.recHit('Hit', sql2).then(res2 => {
                        socket.emit('confirmarEnvioTicket', {
                            idTicket: data.arrayTickets[j]._id,
                            respuestaSql: res
                        });
                    });
                });
            }
        })

        /* GUARDAR FICHAJES */
        socket.on('guardarFichajes', (data) => {
            var fechaEntrada = new Date(data.infoFichaje.fecha.year, data.infoFichaje.fecha.month, data.infoFichaje.fecha.day, data.infoFichaje.fecha.hours, data.infoFichaje.fecha.minutes, data.infoFichaje.fecha.seconds);

            let year = `${fechaEntrada.getFullYear()}`;
            let month = `${fechaEntrada.getMonth() + 1}`;
            let day = `${fechaEntrada.getDate()}`;
            let hours = `${fechaEntrada.getHours()}`;
            let minutes = `${fechaEntrada.getMinutes()}`;
            let seconds = `${fechaEntrada.getSeconds()}`;

            if (month.length === 1) {
                month = '0' + month;
            }
            if (day.length === 1) {
                day = '0' + day;
            }
            if (hours.length === 1) {
                hours = '0' + hours;
            }
            if (minutes.length === 1) {
                minutes = '0' + minutes;
            }
            if (seconds.length === 1) {
                seconds = '0' + seconds;
            }
            if (data.tipo === 'ENTRADA') {

                let sqlEntrada = `INSERT INTO cdpDadesFichador (id, tmst, accio, usuari, idr, lloc, comentari) VALUES (0, CONVERT(datetime, '${year}-${month}-${day} ${hours}:${minutes}:${seconds}', 120), 1, ${data.infoFichaje.idTrabajador}, NEWID(), ${data.idTienda}, '${data.nombreTienda}')`;
                conexion.recHit(data.database, sqlEntrada).then(res => {
                    console.log(res);
                });
            }
            else {
                if (data.tipo === 'SALIDA') {
                    let sqlSalida = `INSERT INTO cdpDadesFichador (id, tmst, accio, usuari, idr, lloc, comentari) VALUES (0, CONVERT(datetime, '${year}-${month}-${day} ${hours}:${minutes}:${seconds}', 120), 2, ${data.infoFichaje.idTrabajador}, NEWID(), ${data.idTienda}, '${data.nombreTienda}')`;
                    conexion.recHit(data.database, sqlSalida).then(res => {
                        console.log(res);
                    });
                }
            }
        });
        /* GUARDAR TICKET */
        socket.on('guardar-ticket', (data) => {
            let sql = '';
            let campoOtros = '';
            for (let i = 0; i < data.cesta.length; i++) {
                if (data.tarjeta) {
                    campoOtros = '[Visa]';
                }
                else {
                    campoOtros = '';
                }
                sql += `INSERT INTO ${data.nombreTabla} (Botiga, Data, Dependenta, Num_tick, Estat, Plu, Quantitat, Import, Tipus_venta, FormaMarcar, Otros) VALUES (${data.codigoTienda}, CONVERT(datetime, '${data.fecha}', 120), ${data.idDependienta}, ${data.idTicket}, '', ${data.cesta[i].idArticulo}, ${data.cesta[i].unidades}, ${data.cesta[i].subtotal}, '${data.tipoVenta}', 0, '${campoOtros}');`;
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

        /* INICIO GUARDAR MOVIMIENTOS (ENTRADA/SALIDA) */
        socket.on('guardar-movimientos', (data) => {
            console.log('Traza 1');
            let sql = '';

            for (let i = 0; i < data.arrayMovimientos.length; i++) {
                console.log('Traza 2');
                let fecha = new Date(data.arrayMovimientos[i].timestamp);
                let year = `${fecha.getFullYear()}`;
                let month = `${fecha.getMonth() + 1}`;
                let day = `${fecha.getDate()}`;
                let hours = `${fecha.getHours()}`;
                let minutes = `${fecha.getMinutes()}`;
                let seconds = `${fecha.getSeconds()}`;

                if (month.length === 1) {
                    month = '0' + month;
                }
                if (day.length === 1) {
                    day = '0' + day;
                }
                if (hours.length === 1) {
                    hours = '0' + hours;
                }
                if (minutes.length === 1) {
                    minutes = '0' + minutes;
                }
                if (seconds.length === 1) {
                    seconds = '0' + seconds;
                }
                let nombreTabla = '[V_Moviments_' + year + '-' + month + ']';

                sql = `INSERT INTO ${nombreTabla} (Botiga, Data, Dependenta, Tipus_moviment, Import, Motiu) VALUES (${data.codigoTienda}, CONVERT(datetime, '${year}-${month}-${day} ${hours}:${minutes}:${seconds}', 120), ${data.arrayMovimientos[i].idTrabajador}, 'O', ${data.arrayMovimientos[i].valor}, '${data.arrayMovimientos[i].concepto}');`;

                conexion.recHit(data.database, sql).then(res2 => {
                    socket.emit('confirmarEnvioMovimiento', {
                        idMovimiento: data.arrayMovimientos[i].id,
                        respuestaSql: res2
                    });
                });
            }
            console.log(sql);
        });
        /* FIN GUARDAR MOVIMIENTOS (ENTRADA/SALIDA) */

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
                let sqlAna = '';
                let sqlAna2 = '';
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

                sqlAna = `INSERT INTO feinesafer VALUES (newid(), 'VigilarAlertes', 0, 'Caixa', '[${inicioDay}-${inicioMonth}-${inicioYear} de ${inicioHours}:${inicioMinutes} a ${finalHours}:${finalMinutes}]', '[${data.codigoTienda}]', '${descuadre}', '${sumaEfectivoTarjetaTotal}', getdate());`;
                sqlAna2 = `insert into feinesafer values (newid(), 'SincroMURANOCaixaOnLine', 0, '[${data.codigoTienda}]', '[${inicioDay}-${inicioMonth}-${inicioYear} ${inicioHours}:${inicioMinutes}:${inicioSeconds}]', '[${finalDay}-${finalMonth}-${finalYear} ${finalHours}:${finalMinutes}:${finalSeconds}]', '[${data.arrayCajas[i].primerTicket},${data.arrayCajas[i].ultimoTicket}]', '[${sumaEfectivoTarjetaTotal}]', getdate());`;
                console.log("sqlAna2: ", sqlAna2);

                let sqlCompleta = sqlZGJ + sqlW + sqlWi + sqlAna + sqlAna2;
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
                conexion.recHit('Hit', `SELECT ll.Llicencia, ll.Empresa, ll.LastAccess, we.Db, ISNULL(ti.ultimoIdTicket, 0) as ultimoIdTicket FROM llicencies ll LEFT JOIN Web_Empreses we ON ll.Empresa = we.Nom LEFT JOIN tocGame_idTickets ti ON ti.licencia = ${data.numLicencia} WHERE ll.Llicencia = ${data.numLicencia}`).then(function (data) {
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

        /* DESCARGAR ARTÍCULOS */
        socket.on('descargar-articulos', (data) => {
            conexion.recHit(data.database, 'SELECT Codi as id, NOM as nombre, PREU as precioConIva, TipoIva as tipoIva, EsSumable as aPeso, Familia as familia, ISNULL(PreuMajor, 0) as precioBase FROM Articles').then(resSQL => {
                if (resSQL) {
                    conexion.recHit(data.database, `SELECT Codi as id, PREU as precioConIva FROM TarifesEspecials WHERE TarifaCodi = (select [Desconte 5] from clients where Codi = ${data.codigoTienda}) AND TarifaCodi <> 0`).then(infoTarifas => {
                        if (infoTarifas) {
                            if (infoTarifas.recordset.length > 0) {
                                resSQL.recordset = configurarTarifasEspecialesViejo(resSQL.recordset, infoTarifas.recordset);
                            }
                            socket.emit('descargar-articulos', resSQL.recordset);
                        }
                        else {
                            socket.emit('error', "Error en la respuesta de la consulta SQL infoTarifas");
                        }
                    });
                }
                else {
                    socket.emit('error', "Error en la respuesta de la consulta SQL resSQL");
                }
            });
        });
        /* FIN DESCARGAR ARTÍCULOS*/

        /* DESCARGAR TRABAJADORES */
        socket.on('descargar-trabajadores', (data) => {
            conexion.recHit(data.database, 'select Codi as idTrabajador, nom as nombre, memo as nombreCorto from dependentes').then(resSQL => {
                if (resSQL) {
                    socket.emit('descargar-trabajadores', resSQL.recordset);

                }
                else {
                    socket.emit('error', "Error en la respuesta de la consulta SQL resSQL");
                }
            });
        });
        /* FIN DESCARGAR TRABAJADORES */

        /* DESCARGAR CLIENTES */
        socket.on('descargar-clientes', (data) => {
            conexion.recHit(data.database, "select Id as id, Nom as nombre, IdExterna as tarjetaCliente from ClientsFinals WHERE Id IS NOT NULL AND Id <> ''").then(resSQL => {
                if (resSQL) {
                    socket.emit('descargar-clientes', resSQL.recordset);

                }
                else {
                    socket.emit('error', "Error en la respuesta de la consulta SQL resSQL");
                }
            });
        });
        /* FIN DESCARGAR CLIENTES */

        /* DESCARGAR PROMOCIONES */
        socket.on('descargar-promociones', (data) => {
            let sqlPromos = `SELECT Id as id, Di as fechaInicio, Df as fechaFinal, D_Producte as principal, D_Quantitat as cantidadPrincipal, S_Producte as secundario, S_Quantitat as cantidadSecundario, S_Preu as precioFinal FROM ProductesPromocionats WHERE Client = ${data.licencia}`;// AND Df > GETDATE()`;
            conexion.recHit(data.database, sqlPromos).then(resSQL => {
                if (resSQL) {
                    socket.emit('descargar-promociones', resSQL.recordset);

                }
                else {
                    socket.emit('error', "Error en la respuesta de la consulta SQL resSQL");
                }
            });
        });
        /* FIN DESCARGAR PROMOCIONES */

        /* DESCARGAR FAMILIAS */
        socket.on('descargar-familias', (data) => {
            conexion.recHit(data.database, 'SELECT Nom as nombre, Pare as padre FROM Families WHERE Nivell > 0').then(resSQL => {
                if (resSQL) {
                    socket.emit('descargar-familias', resSQL.recordset);

                }
                else {
                    socket.emit('error', "Error en la respuesta de la consulta SQL resSQL");
                }
            });
        });
        /* FIN DESCARGAR FAMILIAS */

        /* DESCARGAR TECLADO */
        socket.on('descargar-teclado', (data) => {
            conexion.recHit(data.database, `SELECT DISTINCT Ambient as nomMenu FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then(resMenus => {
                if (resMenus) {
                    conexion.recHit(data.database, `SELECT Ambient as nomMenu,  (select nom from articles where codi = article) as nombreArticulo, article as idArticle, pos, color FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then((resTeclas) => {
                        if (resTeclas) 
                        {
                            let objAux = 
                            {
                                menus: resMenus.recordset,
                                teclas: resTeclas.recordset
                            }
                            socket.emit('descargar-teclado', objAux);
                        }
                        else {
                            socket.emit('error', "Error en la respuesta de la consulta SQL resSQL");
                        }
                    });

                }
                else 
                {
                    socket.emit('error', "Error en la respuesta de la consulta SQL resSQL");
                }
            });
        });
        /* FIN DESCARGAR TECLADO */

        /* OTRA */
        socket.on('cargar-todo', (data) => 
        {
            conexion.recHit(data.database, `SELECT Valor1 as codigoCliente FROM ParamsHw WHERE Codi = ${data.licencia}`).then(res8 => {
                let codigoCliente = res8.recordset[0].codigoCliente;
                if (res8) {
                    conexion.recHit(data.database, 'SELECT Codi as _id, NOM as nombre, PREU as precioConIva, TipoIva as tipoIva, EsSumable as esSumable, Familia as familia, ISNULL(PreuMajor, 0) as precioBase FROM Articles').then(res2 => {
                        conexion.recHit(data.database, `SELECT Codi as id, PREU as precioConIva FROM TarifesEspecials WHERE TarifaCodi = (select [Desconte 5] from clients where Codi = ${codigoCliente}) AND TarifaCodi <> 0`).then(res7 => {
                            if (res7) 
                            {
                                if (res7.recordset.length > 0) 
                                {
                                    res2.recordset = configurarTarifasEspeciales(res2.recordset, res7.recordset);
                                }
                                conexion.recHit(data.database, `SELECT DISTINCT Ambient as nomMenu FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then(res1 => 
                                    {
                                    if (res1) 
                                    {
                                        conexion.recHit(data.database, `SELECT Data, Ambient as nomMenu, (select EsSumable from articles where codi = article) as esSumable, (select nom from articles where codi = article) as nombreArticulo, article as idArticle, pos, color FROM TeclatsTpv WHERE Llicencia = ${data.licencia} AND Data = (select MAX(Data) FROM TeclatsTpv WHERE Llicencia = ${data.licencia} )`).then((res) => {
                                            if (res) {
                                                conexion.recHit(data.database, 'select Codi as idTrabajador, Codi as _id, nom as nombre, memo as nombreCorto from dependentes').then(res3 => {
                                                    if (res3) {
                                                        conexion.recHit(data.database, 'SELECT Nom as nombre, Pare as padre FROM Families WHERE Nivell > 0').then(res4 => {
                                                            if (res4) { //Esta consulta debería buscar el codigo de cliente en el paramsHw, según la licencia data.licencia
                                                                let sqlPromos = `SELECT Id as _id, Di as fechaInicio, Df as fechaFinal, D_Producte as principal, D_Quantitat as cantidadPrincipal, S_Producte as secundario, S_Quantitat as cantidadSecundario, S_Preu as precioFinal FROM ProductesPromocionats WHERE Client = ${data.licencia}`;// AND Df > GETDATE()`;
                                                                conexion.recHit(data.database, sqlPromos).then(async res5 => {
                                                                    if (res5) {
                                                                        res5 = await familiasPorObjetos(res5, data.database, codigoCliente, conexion);
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