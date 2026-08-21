'use strict';

const Joi = require('joi');

const updateSchedule = Joi.object({
  intervalDays: Joi.number().integer().min(7).max(180),
  status: Joi.string().valid('ACTIVE', 'PAUSED', 'CANCELLED'),
}).min(1);

module.exports = { updateSchedule };
