const express = require('express');
const db = require('../db');
const requireLogin = require('../middleware/requireLogin');

const router = express.Router();

router.use(requireLogin);

router.get('/', (req, res) => {
    req.session.views = (req.session.views || 0) + 1;

    res.render('agenda/index', {
        contacte: db.contacte.getToate(),
        vizite: req.session.views,
        ultimContact: req.cookies.ultimContact || null
    });
});

    // detaliu contact
router.get('/:id', (req, res) => {
    const contact = db.contacte.getDupaId(req.params.id);
    if (!contact) {
        return res.status(404).render('agenda/contact', { contact: null });
    }

    // cookie propriu
    res.cookie('ultimContact', contact.nume, {
        maxAge: 1000 * 60 * 60 * 24, // 1 zi
        httpOnly: true
    });

    res.render('agenda/contact', { contact });
});

module.exports = router;
