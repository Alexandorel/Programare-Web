// "Baza de date" a utilizatorilor, tinuta in memorie.
// Doi utilizatori demo, pentru a putea testa login-ul imediat.
const utilizatori = [
    { id: 1, nume: 'Simona Popescu', email: 'mona@example.com', parola: 'secret' },
    { id: 2, nume: 'Radu Ionescu',   email: 'radu@example.com', parola: 'proweb' }
];

// Cauta un utilizator dupa email (sau null daca nu exista).
function gasesteDupaEmail(email) {
    return utilizatori.find(u => u.email === email) || null;
}

// Creeaza un utilizator nou si il adauga in lista.
function creeaza({ nume, email, parola }) {
    const utilizatorNou = { id: Date.now(), nume, email, parola };
    utilizatori.push(utilizatorNou);
    return utilizatorNou;
}

// Verifica credentialele; intoarce utilizatorul daca parola e corecta, altfel null.
function autentifica(email, parola) {
    const utilizator = gasesteDupaEmail(email);
    if (!utilizator) return null;
    return utilizator.parola === parola ? utilizator : null;
}

module.exports = { gasesteDupaEmail, creeaza, autentifica };
