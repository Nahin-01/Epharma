'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const addItem = Joi.object({
  product: objectId.required(),
  quantity: Joi.number().integer().min(1).default(1),
});

const updateItem = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
});

const applyCoupon = Joi.object({
  code: Joi.string().min(3).max(30).allow(null, ''),
});

const updateNotes = Joi.object({
  notes: Joi.string().max(500).allow(''),
});

module.exports = { addItem, updateItem, applyCoupon, updateNotes };
