'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const bookAppointment = Joi.object({
  doctor: objectId.required(),
  chamberId: objectId.required(),
  date: Joi.date().greater('now').required(),
  timeSlot: Joi.string().min(3).max(30).required(),
  notes: Joi.string().max(500).allow(''),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW').required(),
});

module.exports = { bookAppointment, updateStatus };
