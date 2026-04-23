const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.set('views', './views');

app.use(express.urlencoded({ extended: true }));

app.get('/login', (req, res) => {
    res.render('login'); 
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === '1234') {
        res.send('<h1>Autentificare cu succes! Bine ai venit.</h1>');
    } else {
        res.render('login', { error: 'Nume de utilizator sau parolă incorectă!' });
    }
});

app.listen(3000, () => {
    console.log('Serverul rulează! Deschide browserul la: http://localhost:3000/login');
});