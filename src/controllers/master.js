const bcrypt = require('bcryptjs');
const { Master, User } = require('../models');
const { getDb } = require('../config/db');
const { sign } = require('../utils/jwt');
const cache = require('../utils/cache');
const AppError = require('../utils/AppError');

exports.login = async (req, res) => {
  const m = await Master().findOne({ email: req.body.email }).select('+password');
  if (!m || !m.isActive || !(await bcrypt.compare(req.body.password, m.password))) throw new AppError('Invalid credentials', 401);
  res.json({ success: true, token: sign({ id: m._id, role: 'master', dbName: m.dbName }) });
};

exports.createUser = async (req, res) => {
  const U = User(getDb(req.user.dbName));
  const u = await U.create({ ...req.body, password: await bcrypt.hash(req.body.password, 10), createdBy: req.user.id });
  await cache.del(`${req.user.dbName}:users`);
  res.status(201).json({ success: true, data: { _id: u._id, name: u.name, email: u.email } });
};

exports.listUsers = async (req, res) => {
  const key = `${req.user.dbName}:users`;
  const cached = await cache.get(key);
  if (cached) return res.json({ success: true, source: 'cache', data: cached });
  const users = await User(getDb(req.user.dbName)).find().lean();
  await cache.set(key, users);
  res.json({ success: true, source: 'db', data: users });
};