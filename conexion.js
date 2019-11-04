var sql = require("mssql");
/*
function recHit(database, consultaSQL, io)
{   
    var config = {
        user: 'sa',
        password: 'LOperas93786',
        server: 'silema.hiterp.com',
        database: database
    };
    sql.connect(config, (err)=>
    {
        if(err)
        {
            console.log(err);
        }
        var request = new sql.Request();
        request.query(consultaSQL, (err, recordset)=>
        {
            if(err)
            {
                console.log(err);
            }
            sql.close();
            io.sockets.emit('escucho', JSON.stringify(recordset));
        });
    });
}
*/

async function recHitBuena(database, consultaSQL) /*¡DEVUELVE UNA PROMESA!*/
{
    var config = 
    {
        user: 'sa',
        password: 'LOperas93786',
        server: 'silema.hiterp.com',
        database: database
    };
    let pool = await sql.connect(config)
    let result = await pool.request().query(consultaSQL);
    pool.close();
    sql.close();
    return result;
}

function recHit(database, consultaSQL)
{
    var config = 
    {
        user: 'sa',
        password: 'LOperas93786',
        server: 'silema.hiterp.com',
        database: database
    };
    var devolver = new Promise((dev, rej)=>{
        new sql.ConnectionPool(config).connect().then(pool => 
            {
                return pool.request().query(consultaSQL);
            }).then(result => 
                {      
                    dev(result);
                    sql.close();      
                }).catch(err => 
                    {
                        sql.close();      
                    });
    });
    return devolver;
}
module.exports.recHit = recHit;