'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const createCategory = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  bnName: Joi.string().max(100).allow(''),
  slug: Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).max(100).required(),
  description: Joi.string().max(1000).allow(''),
  icon: Joi.string().allow(''),
  image: Joi.string().allow(''),
  parent: objectId.optional().allow(null),
  order: Joi.number().integer().default(0),
  isActive: Joi.boolean().default(true),
});

const updateCategory = createCategory.fork(['name', 'slug'], (schema) => schema.optional()).min(1);

module.exports = { createCategory, updateCategory };
