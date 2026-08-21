'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');
const { PRESCRIPTION_STATUS } = require('../../constants/orderStatus');

const uploadPrescription = Joi.object({
  source: Joi.string().valid('UPLOAD', 'CHECKOUT', 'PRODUCT_REQUEST').default('UPLOAD'),
});

const reviewPrescription = Joi.object({
  status: Joi.string()
    .valid(...Object.values(PRESCRIPTION_STATUS))
    .required(),
  notes: Joi.string().max(2000).allow(''),
});

const addClarification = Joi.object({
  note: Joi.string().min(2).max(1000).required(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid(...Object.values(PRESCRIPTION_STATUS)),
  customer: objectId.optional(),
});

module.exports = { uploadPrescription, reviewPrescription, addClarification, listQuery };
