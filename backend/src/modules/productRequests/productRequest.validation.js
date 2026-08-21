'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const createRequest = Joi.object({
  productName: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).allow(''),
  prescription: objectId.optional().allow(null),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('PENDING', 'REVIEWING', 'SOURCED', 'REJECTED', 'FULFILLED').required(),
  adminNotes: Joi.string().max(1000).allow(''),
});

module.exports = { createRequest, updateStatus };
