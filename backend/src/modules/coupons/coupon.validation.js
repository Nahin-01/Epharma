'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const createCoupon = Joi.object({
  code: Joi.string().min(3).max(30).uppercase().required(),
  description: Joi.string().max(500).allow(''),
  type: Joi.string().valid('PERCENTAGE', 'FIXED').required(),
  value: Joi.number().min(0).required(),
  minOrderAmount: Joi.number().min(0).default(0),
  maxDiscountAmount: Joi.number().min(0).allow(null),
  usageLimit: Joi.number().integer().min(1).allow(null),
  usageLimitPerCustomer: Joi.number().integer().min(1).default(1),
  startsAt: Joi.date().default(() => new Date()),
  expiresAt: Joi.date().greater(Joi.ref('startsAt')).required(),
  isActive: Joi.boolean().default(true),
  applicableCategories: Joi.array().items(objectId).default([]),
});

const updateCoupon = createCoupon.fork(['code', 'type', 'value', 'expiresAt'], (schema) => schema.optional()).min(1);

const applyCoupon = Joi.object({
  code: Joi.string().min(3).max(30).required(),
});

module.exports = { createCoupon, updateCoupon, applyCoupon };
