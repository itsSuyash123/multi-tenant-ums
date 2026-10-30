const bcrypt = require('bcryptjs');
const { SuperAdmin, Master } = require('../models');
const { sign } = require('../utils/jwt');
const cache = require('../utils/cache');
const AppError = require('../utils/AppError');

exports.login = async (req, res) => {
  const admin = await SuperAdmin().findOne({ email: req.body.email }).select('+password');
  if (!admin || !(await bcrypt.compare(req.body.password, admin.password))) throw new AppError('Invalid credentials', 401);
  res.json({ success: true, token: sign({ id: admin._id, role: 'superadmin' }) });
};

exports.createMaster = async (req, res) => {
  const { name, email, password, code } = req.body;
  const master = await Master().create({
    name, email, code, dbName: `tenant_${code}`,
    password: await bcrypt.hash(password, 10), createdBy: req.user.id,
  });
  await cache.del('masters:list');
  const { password: _, ...data } = master.toObject();
  res.status(201).json({ success: true, data });
};

exports.listMasters = async (_req, res) => {
  const cached = await cache.get('masters:list');
  if (cached) return res.json({ success: true, source: 'cache', data: cached });
  const masters = await Master().find().sort('-createdAt').lean();
  await cache.set('masters:list', masters);
  res.json({ success: true, source: 'db', data: masters });
};