const contacte = [
    { id: 1, nume: 'Andrei Popescu',   telefon: '0721 100 200', email: 'andrei.popescu@example.com',   oras: 'Iasi',       categorie: 'Familie'  },
    { id: 2, nume: 'Maria Ionescu',    telefon: '0742 300 400', email: 'maria.ionescu@example.com',    oras: 'Cluj',       categorie: 'Prieteni' },
    { id: 3, nume: 'Vlad Georgescu',   telefon: '0733 500 600', email: 'vlad.georgescu@example.com',   oras: 'Bucuresti',  categorie: 'Serviciu' },
    { id: 4, nume: 'Elena Marin',      telefon: '0755 700 800', email: 'elena.marin@example.com',      oras: 'Iasi',       categorie: 'Prieteni' },
    { id: 5, nume: 'Cristina Dumitru', telefon: '0766 900 100', email: 'cristina.dumitru@example.com', oras: 'Timisoara',  categorie: 'Serviciu' },
    { id: 6, nume: 'Radu Stancu',      telefon: '0777 200 300', email: 'radu.stancu@example.com',      oras: 'Brasov',     categorie: 'Familie'  }
];

function getToate() {
    return contacte;
}

function getDupaId(id) {
    return contacte.find(c => c.id === Number(id)) || null;
}

module.exports = { getToate, getDupaId };