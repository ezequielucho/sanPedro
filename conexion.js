var sql = require("mssql");
function recHit(database, consultaSQL)
{   
    var config = {
        user: 'sa',
        password: 'LOperas93786',
        server: 'silema.hiterp.com',
        database: database
    };
    sql.connect(config, (err)=>{
        if(err)
        {
            console.log(err);
        }
        var request = new sql.Request();
        request.query(consultaSQL, (err, recordset)=>{
            if(err)
            {
                console.log(err);
            }
            sql.close();
            console.log("Esta es la prueba de que SÍ entra a la función");
            return JSON.stringify(recordset);
        });
    });
}
module.exports.recHit = recHit;