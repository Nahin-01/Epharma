'use strict';

const Joi = require('joi');

const createGeneric = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  bnName: Joi.string().max(150).allow(''),
  description: Joi.string().max(1000).allow(''),
  therapeuticClass: Joi.string().max(150).allow(''),
  isActive: Joi.boolean().default(true),
});

const updateGeneric = createGeneric.fork(['name'], (schema) => schema.optional()).min(1);

module.exports = { createGeneric, updateGeneric };
