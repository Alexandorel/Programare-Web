require('dotenv').config();

const express = require('express');
const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.redirect('/login');
});

const authRoutes = require('./routes/auth');

app.use('/', authRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});
