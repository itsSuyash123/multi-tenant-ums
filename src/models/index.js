const { getDb } = require('../config/db');
const s = require('./schemas');
const model = (conn, name, schema) => conn.models[name] || conn.model(name, schema);

const mainDb = () => getDb(process.env.MAIN_DB);
module.exports = {
  SuperAdmin: () => model(mainDb(), 'SuperAdmin', s.superAdminSchema),
  Master: () => model(mainDb(), 'Master', s.masterSchema),
  User: (conn) => model(conn, 'User', s.userSchema),
  Data: (conn) => model(conn, 'Data', s.dataSchema),
};