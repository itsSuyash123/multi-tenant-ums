const { verify } = require('../utils/jwt');
const AppError = require('../utils/AppError');

module.exports = (...roles) => (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next(new AppError('Token missing', 401));
  try {
    const payload = verify(token);
    if (!roles.includes(payload.role)) return next(new AppError('Access denied for this system', 403));
    req.user = payload; // { id, role, dbName? }
    next();
  } catch { next(new AppError('Invalid or expired token', 401)); }
};