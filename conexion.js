var sql = require("mssql");
function recHit(database, consultaSQL)
{   
    var aux = null;
    var config = {
        user: 'sa',
        password: 'LOperas93786',
        server: 'silema.hiterp.com',
        database: database
    };
    aux = sql.connect(config, (err)=>{
        if(err)
        {
            console.log(err);
        }
        var request = new sql.Request();
        return request.query(consultaSQL, (err, recordset)=>{
            if(err)
            {
                console.log(err);
            }
            sql.close();
            return JSON.stringify(recordset);
        });
    });
    return aux;
}
module.exports.recHit = recHit;