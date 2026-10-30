const r = require('express').Router();
const c = require('../controllers/publicAuth');
const auth = require('../middlewares/auth');
const v = require('../middlewares/validate');
const s = require('../validators/schemas');

r.post('/signup', v(s.signup), c.signup);
r.post('/login', v(s.login), c.login);
r.get('/profile', auth('public_user'), c.profile);

module.exports = r;