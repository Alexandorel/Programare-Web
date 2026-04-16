const express = require('express');
const path = require('path');
var app = express();

app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

app.post('/login', function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    if (username === 'admin' && password === 'admin') {
        res.send('Login successful!');
    } else {
        res.send('Invalid username or password');
    }
});


app.listen(3000, function () {
    console.log("Example app listening at port 3000");
});
