var express = require('express');
var app = express();
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', function (req, res) {
    // assuming index.html is in the same directory as this script
    res.sendFile(__dirname + '/index.html');
    // Specifying the root path is more useful
    // res.sendFile('index.html', { root: __dirname });
});
app.post('/demo', function (req, res) {
    var name = '<b>' + req.body.name + '</b>';
    res.send(name + ' Submitted Successfully!');
});
var server = app.listen(8001, function () {
    console.log('Node server is running..');
});