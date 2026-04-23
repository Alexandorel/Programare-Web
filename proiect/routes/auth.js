const express = require('express');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Autentificare - NodeNotes',
        error: null
    });
});

router.post('/login', (req, res) => {
    const { username, password, rememberMe } = req.body;
    res.send(`Se încearcă autentificarea pentru utilizatorul: ${username}`);
});

module.exports = router;