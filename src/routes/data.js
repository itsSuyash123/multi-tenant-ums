const r = require('express').Router();
const c = require('../controllers/data');
const auth = require('../middlewares/auth');
const tenant = require('../middlewares/tenant');
const v = require('../middlewares/validate');
const s = require('../validators/schemas');

r.use(auth('public_user', 'master_user', 'master'), tenant);
r.post('/', v(s.data), c.create);
r.get('/', c.list);
r.get('/:id', c.getOne);
r.put('/:id', v(s.dataUpdate), c.update);
r.delete('/:id', c.remove);

module.exports = r;