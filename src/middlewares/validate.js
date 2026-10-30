const AppError = require('../utils/AppError');
module.exports = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(new AppError(error.details.map(d => d.message).join(', '), 422));
  req.body = value; next();
};