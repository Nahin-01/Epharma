'use strict';

const Joi = require('joi');
const { ROLES } = require('../../constants/roles');

const createStaffUser = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .optional(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string()
    .valid(...Object.values(ROLES).filter((r) => r !== ROLES.CUSTOMER))
    .required(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

const updateUser = Joi.object({
  name: Joi.string().min(2).max(100),
  role: Joi.string().valid(...Object.values(ROLES)),
  permissions: Joi.array().items(Joi.string()),
  isActive: Joi.boolean(),
}).min(1);

const listUsersQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  role: Joi.string().valid(...Object.values(ROLES)),
  search: Joi.string().allow(''),
});

module.exports = { createStaffUser, updateUser, listUsersQuery };
