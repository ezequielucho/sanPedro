var sql = require("mssql");

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