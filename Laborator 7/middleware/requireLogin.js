module.exports = function requireLogin(req, res, next) {
    if (req.session && req.session.utilizator) {
        return next();
    }
    res.redirect('/login');
};