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
async function recHit(database, consultaSQL, io)
{
    var config = 
    {
        user: 'sa',
        password: 'LOperas93786',
        server: 'silema.hiterp.com',
        database: database
    };
    let pool = await sql.connect(config)
    let result1 = await pool.request().query(consultaSQL);
    return result1;
}
module.exports.recHit = recHit;