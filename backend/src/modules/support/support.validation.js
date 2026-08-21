'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const createTicket = Joi.object({
  subject: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(2).max(2000).required(),
  channel: Joi.string().valid('CHAT', 'EMAIL', 'PHONE').default('CHAT'),
  relatedOrder: objectId.optional().allow(null),
  relatedPrescription: objectId.optional().allow(null),
});

const addMessage = Joi.object({
  message: Joi.string().min(1).max(2000).required(),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED').required(),
});

const assign = Joi.object({
  assignedTo: objectId.required(),
});

module.exports = { createTicket, addMessage, updateStatus, assign };
