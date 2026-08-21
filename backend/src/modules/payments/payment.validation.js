'use strict';

const Joi = require('joi');

const callback = Joi.object({
  transactionId: Joi.string().required(),
  status: Joi.string().valid('PAID', 'FAILED').optional(),
});

const refund = Joi.object({
  amount: Joi.number().min(0.01).required(),
});

module.exports = { callback, refund };
