'use strict';

const Joi = require('joi');

const createWarehouse = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  code: Joi.string().min(2).max(20).required(),
  district: Joi.string().min(2).max(100).required(),
  address: Joi.string().max(300).allow(''),
  contactPhone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).allow(''),
  isActive: Joi.boolean().default(true),
});

const updateWarehouse = createWarehouse.fork(['name', 'code', 'district'], (schema) => schema.optional()).min(1);

module.exports = { createWarehouse, updateWarehouse };
