'use strict';

const Joi = require('joi');

const createBrand = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  bnName: Joi.string().max(100).allow(''),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).max(100).required(),
  logo: Joi.string().allow(''),
  description: Joi.string().max(1000).allow(''),
  isActive: Joi.boolean().default(true),
});

const updateBrand = createBrand.fork(['name', 'slug'], (schema) => schema.optional()).min(1);

module.exports = { createBrand, updateBrand };
