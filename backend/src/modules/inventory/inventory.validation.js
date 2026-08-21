'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const createBatch = Joi.object({
  product: objectId.required(),
  warehouse: objectId.required(),
  supplier: objectId.optional().allow(null),
  batchNumber: Joi.string().min(1).max(100).required(),
  purchasePrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(1).required(),
  manufacturingDate: Joi.date().optional(),
  expiryDate: Joi.date().greater('now').required(),
});

const updateBatch = Joi.object({
  purchasePrice: Joi.number().min(0),
  sellingPrice: Joi.number().min(0),
  quantity: Joi.number().integer().min(0),
  expiryDate: Joi.date(),
  status: Joi.string().valid('ACTIVE', 'EXPIRED', 'DEPLETED', 'RECALLED'),
}).min(1);

const listBatchesQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  product: objectId.optional(),
  warehouse: objectId.optional(),
  status: Joi.string().valid('ACTIVE', 'EXPIRED', 'DEPLETED', 'RECALLED').optional(),
  expiringWithinDays: Joi.number().integer().min(1).optional(),
});

module.exports = { createBatch, updateBatch, listBatchesQuery };
