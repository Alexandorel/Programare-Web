const express = require('express');
const User = require('../db/users');

const router = express.Router();

router.get('/login', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('login', { title: 'Autentificare - NodeNotes', error: null });
});

router.post('/login', async (req, res, next) => {
    try {
        const username = String(req.body.username || '').trim();
        if (!username) {
            return res.status(400).render('login', {
                title: 'Autentificare - NodeNotes',
                error: 'Username obligatoriu'
            });
        }
        let user = await User.findOne({ username });
        if (!user) user = await User.create({ username });
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.get('/register', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('register', { title: 'Inregistrare - NodeNotes', error: null });
});

router.post('/register', async (req, res, next) => {
    try {
        const username = String(req.body.username || '').trim();
        if (!username) {
            return res.status(400).render('register', {
                title: 'Inregistrare - NodeNotes',
                error: 'Username obligatoriu'
            });
        }
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).render('register', {
                title: 'Inregistrare - NodeNotes',
                error: 'Username deja folosit'
            });
        }
        const user = await User.create({ username });
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        res.redirect('/dashboard');
    } catch (err) {
        next(err);
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
