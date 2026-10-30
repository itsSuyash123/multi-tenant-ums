const { Data } = require('../models');
const cache = require('../utils/cache');
const AppError = require('../utils/AppError');
const key = (req) => `${req.db.name}:data:${req.user.id}`;

exports.create = async (req, res) => {
  const doc = await Data(req.db).create({ ...req.body, owner: req.user.id });
  await cache.del(key(req));
  res.status(201).json({ success: true, data: doc });
};
exports.list = async (req, res) => {
  const cached = await cache.get(key(req));
  if (cached) return res.json({ success: true, source: 'cache', data: cached });
  const docs = await Data(req.db).find({ owner: req.user.id }).sort('-createdAt').lean();
  await cache.set(key(req), docs);
  res.json({ success: true, source: 'db', data: docs });
};
exports.getOne = async (req, res) => {
  const doc = await Data(req.db).findOne({ _id: req.params.id, owner: req.user.id });
  if (!doc) throw new AppError('Not found', 404);
  res.json({ success: true, data: doc });
};
exports.update = async (req, res) => {
  const doc = await Data(req.db).findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, req.body, { new: true, runValidators: true });
  if (!doc) throw new AppError('Not found', 404);
  await cache.del(key(req));
  res.json({ success: true, data: doc });
};
exports.remove = async (req, res) => {
  const doc = await Data(req.db).findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!doc) throw new AppError('Not found', 404);
  await cache.del(key(req));
  res.json({ success: true, message: 'Deleted' });
};