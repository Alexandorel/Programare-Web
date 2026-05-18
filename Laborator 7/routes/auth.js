const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/register', (req, res) => {
    if (req.session.utilizator) return res.redirect('/agenda');
    res.render('register', { eroare: null });
});

router.post('/register', async (req, res, next) => {
    try {
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

        const utilizator = await db.users.creeaza({ nume, email, parola });
        // pornire sesiune
        req.session.utilizator = {
            id: utilizator.id,
            nume: utilizator.nume,
            email: utilizator.email
        };
        res.redirect('/agenda');
    } catch (err) {
        next(err);
    }
});

router.get('/login', (req, res) => {
    if (req.session.utilizator) return res.redirect('/agenda');
    res.render('login', { eroare: null });
});

router.post('/login', async (req, res, next) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const parola = String(req.body.parola || '');

        const utilizator = await db.users.autentifica(email, parola);
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
        res.redirect('/agenda');
    } catch (err) {
        next(err);
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

module.exports = router;