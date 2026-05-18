const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const FISIER = path.join(__dirname, 'users.json');

// Citire lista utilizatori
function citesteToti() {
    if (!fs.existsSync(FISIER)) {
        fs.writeFileSync(FISIER, '[]', 'utf8');
        return [];
    }
    const continut = fs.readFileSync(FISIER, 'utf8');
    return continut.trim() ? JSON.parse(continut) : [];
}

// Salvare in json
function salveaza(lista) {
    fs.writeFileSync(FISIER, JSON.stringify(lista, null, 2), 'utf8');
}

// Cautare dupa email
function gasesteDupaEmail(email) {
    return citesteToti().find(u => u.email === email) || null;
}

// Creare utilizator cu hashed password
async function creeaza({ nume, email, parola }) {
    const lista = citesteToti();
    const parolaHash = await bcrypt.hash(parola, 10);
    const utilizatorNou = { id: Date.now(), nume, email, parolaHash };
    lista.push(utilizatorNou);
    salveaza(lista);
    return utilizatorNou;
}

// Verificare credentiale
async function autentifica(email, parola) {
    const utilizator = gasesteDupaEmail(email);
    if (!utilizator) return null;
    const corect = await bcrypt.compare(parola, utilizator.parolaHash);
    return corect ? utilizator : null;
}

module.exports = { gasesteDupaEmail, creeaza, autentifica };
