require('dotenv').config();
const { connectDB } = require('./config/db');
const redis = require('./config/redis');
(async () => {
  await connectDB();
  await redis.connect().catch(() => console.warn('Redis unavailable, running without cache'));
  require('./app').listen(process.env.PORT, () => console.log(`Server on ${process.env.PORT}`));
})();