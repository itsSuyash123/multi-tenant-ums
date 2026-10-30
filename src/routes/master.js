const r = require('express').Router();
const m = require('../controllers/master');
const mu = require('../controllers/masterUser');
const auth = require('../middlewares/auth');
const v = require('../middlewares/validate');
const s = require('../validators/schemas');

r.post('/login', v(s.login), m.login);
r.post('/user/login', v(s.masterUserLogin), mu.login);
r.get('/user/profile', auth('master_user'), mu.profile);
r.post('/user', auth('master'), v(s.signup), m.createUser);
r.get('/users', auth('master'), m.listUsers);

module.exports = r;