var express = require('express');
var app = express();

app.get('/', function (req, res) {
   
    var sql = require("mssql");

    // config for your database
    var config = {
        user: 'sa',
        password: 'LOperas93786',
        server: 'silema.hiterp.com', 
        database: 'Fac_Demo' 
    };

    // connect to your database
    sql.connect(config, function (err) {
    
        if (err) console.log(err);

        // create Request object
        var request = new sql.Request();
           
        // query to the database and get the records
        request.query('select codi, nom from clients', function (err, recordset) {
            
            if (err) console.log(err)

            // send records as a response
            res.send(JSON.stringify(recordset));
            sql.close();
        });
    });
});

var server = app.listen(8080, function () {
    console.log('Server is running..');
});