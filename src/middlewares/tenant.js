const { getDb } = require('../config/db');
module.exports = (req, _res, next) => {
  req.db = req.user.role === 'public_user'
    ? getDb(process.env.PUBLIC_DB)
    : getDb(req.user.dbName); // master & master_user
  next();
};