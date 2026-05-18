require('dotenv').config();

const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

const db = require('./db');
const logger = require('./middleware/logger');
const requireLogin = require('./middleware/requireLogin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-implicit',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 }
}));
app.use(logger); 

function gravatarUrl(email) {
    const hash = crypto
        .createHash('md5')
        .update(email.trim().toLowerCase())
        .digest('hex');
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}

app.get('/', requireLogin, (req, res) => {
    req.session.views = (req.session.views || 0) + 1;
    const utilizator = req.session.utilizator;
    res.render('home', {
        utilizator,
        gravatar: gravatarUrl(utilizator.email),
        views: req.session.views
    });
});

app.get('/register', (req, res) => {
    if (req.session.utilizator) return res.redirect('/');
    res.render('register', { eroare: null });
});

app.post('/register', (req, res) => {
    const nume = String(req.body.nume || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const parola = String(req.body.parola || '');

    if (!nume || !email || !parola) {
        return res.status(400).render('register', {
            eroare: 'Toate campurile sunt obligatorii.'
        });
    }
    if (db.users.gasesteDupaEmail(email)) {
        return res.status(400).render('register', {
            eroare: 'Exista deja un cont cu acest email.'
        });
    }

    const utilizator = db.users.creeaza({ nume, email, parola });
    req.session.utilizator = {
        id: utilizator.id,
        nume: utilizator.nume,
        email: utilizator.email
    };
    res.redirect('/');
});

app.get('/login', (req, res) => {
    if (req.session.utilizator) return res.redirect('/');
    res.render('login', { eroare: null });
});

app.post('/login', (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const parola = String(req.body.parola || '');

    const utilizator = db.users.autentifica(email, parola);
    if (!utilizator) {
        return res.status(401).render('login', {
            eroare: 'Email sau parola incorecte.'
        });
    }

    req.session.utilizator = {
        id: utilizator.id,
        nume: utilizator.nume,
        email: utilizator.email
    };
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serverul ruleaza pe http://localhost:${PORT}`);
});
