const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { getDb } = require('../config/db');
const { sign } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const PublicUser = () => User(getDb(process.env.PUBLIC_DB));

exports.signup = async (req, res) => {
  const u = await PublicUser().create({ ...req.body, password: await bcrypt.hash(req.body.password, 10) });
  res.status(201).json({ success: true, token: sign({ id: u._id, role: 'public_user' }) });
};
exports.login = async (req, res) => {
  const u = await PublicUser().findOne({ email: req.body.email }).select('+password');
  if (!u || !(await bcrypt.compare(req.body.password, u.password))) throw new AppError('Invalid credentials', 401);
  res.json({ success: true, token: sign({ id: u._id, role: 'public_user' }) });
};
exports.profile = async (req, res) => {
  res.json({ success: true, data: await PublicUser().findById(req.user.id).lean() });
};