var express = require('express');
var sql = require('mssql');
var path = require('path');
var app = express();

async function testSql()
{
    try
    {
        await sql.ConnectionError('mssql:sa:LOperas93786@silema.hiterp.com/Fac_Demo');
        var result = await sql.query`select codi, nom from clients`;
        return result;
    } catch(err)
    {
        console.log(err);
    }
}

app.get("/", function(req, res){
    testSql().then(resultado=>{
        if(resultado)
        {
            res.writeHead(200, {'content-type': 'application/json'})
            res.end(JSON.stringify(resultado));
        }
        else
        {
            console.log("Error 10");
            res.writeHead(200, {'content-type': 'text/html'})
            res.end('Error en la consulta procedimiento');
        }
    });
});

app.listen(8080);