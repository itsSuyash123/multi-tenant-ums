const { Schema } = require('mongoose');
const opts = { timestamps: true };

exports.superAdminSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
}, opts);

exports.masterSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  code: { type: String, required: true, unique: true, lowercase: true }, // tenant slug
  dbName: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'SuperAdmin' },
}, opts);

// Same shape for public users and master users, stored in different DBs
exports.userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  createdBy: { type: Schema.Types.ObjectId }, // masterId (tenant users only)
  isActive: { type: Boolean, default: true },
}, opts);

exports.dataSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  owner: { type: Schema.Types.ObjectId, required: true, index: true },
}, opts);