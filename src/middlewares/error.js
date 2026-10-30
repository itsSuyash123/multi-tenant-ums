module.exports = (err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ success: false, message: `Duplicate: ${Object.keys(err.keyValue)}` });
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid id' });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
};