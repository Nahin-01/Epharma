'use strict';

const Joi = require('joi');

const createSupplier = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  contactPerson: Joi.string().max(100).allow(''),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  email: Joi.string().email().allow(''),
  address: Joi.string().max(300).allow(''),
  licenseNumber: Joi.string().max(100).allow(''),
  isActive: Joi.boolean().default(true),
});

const updateSupplier = createSupplier.fork(['name', 'phone'], (schema) => schema.optional()).min(1);

module.exports = { createSupplier, updateSupplier };
