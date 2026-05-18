// Middleware de logging: noteaza in consola fiecare cerere si utilizatorul.
module.exports = function logger(req, res, next) {
    const user = req.session && req.session.utilizator
        ? req.session.utilizator.email
        : 'anonim';
    console.log(`${req.method} ${req.url} - user: ${user}`);
    next();
};
