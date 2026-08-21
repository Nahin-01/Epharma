'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');
const { ORDER_STATUS } = require('../../constants/orderStatus');

const addressSnapshot = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  line1: Joi.string().min(3).max(200).required(),
  line2: Joi.string().max(200).allow(''),
  district: Joi.string().min(2).max(100).required(),
  area: Joi.string().max(100).allow(''),
  thana: Joi.string().max(100).allow(''),
  postCode: Joi.string().max(20).allow(''),
});

const checkout = Joi.object({
  addressId: objectId.optional(),
  address: addressSnapshot.optional(),
  deliveryType: Joi.string().valid('STANDARD', 'EXPRESS').default('STANDARD'),
  deliveryDate: Joi.date().optional(),
  notes: Joi.string().max(500).allow(''),
  couponCode: Joi.string().max(30).allow(null, ''),
  prescriptionId: objectId.optional().allow(null),
  paymentMethod: Joi.string().valid('COD', 'BKASH', 'NAGAD', 'ROCKET', 'SSLCOMMERZ', 'CARD').required(),
  recurring: Joi.boolean().default(false),
  recurringIntervalDays: Joi.number().integer().min(7).max(180).default(30),
})
  .or('addressId', 'address')
  .messages({ 'object.missing': 'Either addressId or a full address is required' });

const updateStatus = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .required(),
  note: Joi.string().max(500).allow(''),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  status: Joi.string().valid(...Object.values(ORDER_STATUS)),
  customer: objectId.optional(),
});

module.exports = { checkout, updateStatus, listQuery, addressSnapshot };
