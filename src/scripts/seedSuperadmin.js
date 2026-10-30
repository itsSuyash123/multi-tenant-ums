require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { SuperAdmin } = require('../models');
(async () => {
  await connectDB();
  const email = process.env.SUPERADMIN_EMAIL;
  if (!(await SuperAdmin().findOne({ email })))
    await SuperAdmin().create({ email, password: await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 10) });
  console.log('Superadmin ready'); await mongoose.disconnect();
})();