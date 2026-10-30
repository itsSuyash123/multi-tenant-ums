const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false, // fail fast instead of queuing commands
});

let warned = false;
redis.on('error', (err) => {
  if (!warned) console.warn('Redis unavailable (running without cache):', err.message);
  warned = true;
});
redis.on('ready', () => { warned = false; console.log('Redis connected'); });

module.exports = redis;