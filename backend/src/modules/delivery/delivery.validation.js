'use strict';

const Joi = require('joi');

const createZone = Joi.object({
  district: Joi.string().min(2).max(100).required(),
  area: Joi.string().max(100).allow(''),
  charge: Joi.number().min(0).required(),
  expressCharge: Joi.number().min(0).optional(),
  estimatedDays: Joi.number().integer().min(0).default(2),
  isActive: Joi.boolean().default(true),
});

const updateZone = createZone.fork(['district', 'charge'], (schema) => schema.optional()).min(1);

module.exports = { createZone, updateZone };
