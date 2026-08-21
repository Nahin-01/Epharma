'use strict';

const Joi = require('joi');
const mongoose = require('mongoose');

/**
 * Shared Joi extension for validating MongoDB ObjectId strings. Imported by
 * every module's validation.js that references another document by id.
 */
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'ObjectId validation').messages({ 'any.invalid': '"{{#label}}" must be a valid id' });

module.exports = objectId;
