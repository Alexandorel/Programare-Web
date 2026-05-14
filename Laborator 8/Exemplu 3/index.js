var express = require('express');
var app = express();
app.use(express.urlencoded({ extended: true }));
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: __dirname });
});
app.get('/mac', function (req, res) {
    res.sendFile('mac.svg', { root: __dirname });
});
app.post('/user', function (req, res) {
    console.log(req.method + ' ' + req.url);
    console.log(req.body);
    res.send('data received');
});
var server = app.listen(8001, function () {
    console.log('Node server is running..');
});