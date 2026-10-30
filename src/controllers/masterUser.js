const bcrypt = require('bcryptjs');
const { Master, User } = require('../models');
const { getDb } = require('../config/db');
const { sign } = require('../utils/jwt');
const AppError = require('../utils/AppError');

exports.login = async (req, res) => {
  const master = await Master().findOne({ code: req.body.masterCode, isActive: true });
  if (!master) throw new AppError('Invalid credentials', 401);
  const u = await User(getDb(master.dbName)).findOne({ email: req.body.email }).select('+password');
  if (!u || !u.isActive || !(await bcrypt.compare(req.body.password, u.password))) throw new AppError('Invalid credentials', 401);
  res.json({ success: true, token: sign({ id: u._id, role: 'master_user', dbName: master.dbName }) });
};
exports.profile = async (req, res) => {
  res.json({ success: true, data: await User(getDb(req.user.dbName)).findById(req.user.id).lean() });
};