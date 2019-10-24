var express = require('express');
var path = require('path');
var app = express();

app.get("/", function(req, res){
    res.writeHead(200, {'content-type': 'text/plain'})
    res.end('Hola mundo');
});

app.listen(80);