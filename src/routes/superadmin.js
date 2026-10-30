const r = require('express').Router();
const c = require('../controllers/superadmin'), auth = require('../middlewares/auth'),
      v = require('../middlewares/validate'), s = require('../validators/schemas');
r.post('/login', v(s.login), c.login);
r.post('/master', auth('superadmin'), v(s.createMaster), c.createMaster);
r.get('/masters', auth('superadmin'), c.listMasters);
module.exports = r;