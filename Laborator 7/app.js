require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const logger = require('./middleware/logger');
const authRoutes = require('./routes/auth');
const agendaRoutes = require('./routes/agenda');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret-implicit',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 } 
}));

app.use(logger);

app.use((req, res, next) => {
    res.locals.utilizator = req.session.utilizator || null;
    next();
});

app.get('/', (req, res) => {
    res.render('home');
});

// Routes
app.use('/', authRoutes);
app.use('/agenda', agendaRoutes);

app.use((req, res) => {
    res.status(404).send('404 - Pagina nu a fost gasita');
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Eroare interna a serverului.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serverul ruleaza pe http://localhost:${PORT}`);
});
