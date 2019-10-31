io.on('connection', (socket)=>
{
    socket.on('eze-test', (data)=>{
        conexion.recHit('Fac_Demo', 'SELECT * FROM Clients', io);
    });

    socket.on('install-licencia', (data)=>{
        if(data.password == 'LOperas93786')
        {
            conexion.recHit('Hit', `SELECT * FROM llicencies WHERE Llicencia = ${data.numLicencia}`, io).then(function(data){
                console.log(data);
            });
            
        }
        console.log(data.numLicencia, data.password);
        //conexion.recHit('Fac_Demo', '', io);
    });

    //socket.on();
});