const mongoose = require('mongoose');
const connectDB = () => mongoose.connect(process.env.MONGO_URI);
const getDb = (name) => mongoose.connection.useDb(name, { useCache: true });
module.exports = { connectDB, getDb };