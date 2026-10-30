const Joi = require('joi');
const email = Joi.string().email().required();
const password = Joi.string().min(6).required();
module.exports = {
  login: Joi.object({ email, password }),
  masterUserLogin: Joi.object({ email, password, masterCode: Joi.string().required() }),
  signup: Joi.object({ name: Joi.string().min(2).required(), email, password }),
  createMaster: Joi.object({ name: Joi.string().required(), email, password,
    code: Joi.string().alphanum().lowercase().min(3).max(20).required() }),
  data: Joi.object({ title: Joi.string().required(), description: Joi.string().allow('') }),
  dataUpdate: Joi.object({ title: Joi.string(), description: Joi.string().allow('') }).min(1),
};