'use strict';

const Joi = require('joi');

const updateProfile = Joi.object({
  dateOfBirth: Joi.date().max('now'),
  gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER'),
  preferredLanguage: Joi.string().valid('en', 'bn'),
  preferences: Joi.object({
    smsNotifications: Joi.boolean(),
    inAppNotifications: Joi.boolean(),
    recurringOrderReminders: Joi.boolean(),
  }),
}).min(1);

const address = Joi.object({
  label: Joi.string().max(30).default('Home'),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  line1: Joi.string().min(3).max(200).required(),
  line2: Joi.string().max(200).allow(''),
  district: Joi.string().min(2).max(100).required(),
  area: Joi.string().max(100).allow(''),
  thana: Joi.string().max(100).allow(''),
  postCode: Joi.string().max(20).allow(''),
  isDefault: Joi.boolean().default(false),
});

const updateAddress = address.fork(
  ['name', 'phone', 'line1', 'district'],
  (schema) => schema.optional()
);

module.exports = { updateProfile, address, updateAddress };
