const redis = require('../config/redis');
const ready = () => redis.status === 'ready';

exports.get = async (k) => { if (!ready()) return null; try { const v = await redis.get(k); return v && JSON.parse(v); } catch { return null; } };
exports.set = async (k, v, ttl = 300) => { if (!ready()) return; try { await redis.set(k, JSON.stringify(v), 'EX', ttl); } catch {} };
exports.del = async (...k) => { if (!ready()) return; try { await redis.del(...k); } catch {} };