'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const availability = Joi.object({
  day: Joi.string().valid('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT').required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
});

const chamber = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  address: Joi.string().max(300).allow(''),
  district: Joi.string().min(2).max(100).required(),
  upazilla: Joi.string().max(100).allow(''),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).allow(''),
  consultationFee: Joi.number().min(0).default(0),
  availability: Joi.array().items(availability).default([]),
});

const createDoctor = Joi.object({
  user: objectId.optional().allow(null),
  name: Joi.string().min(2).max(150).required(),
  bnName: Joi.string().max(150).allow(''),
  specialty: Joi.string().min(2).max(100).required(),
  qualifications: Joi.array().items(Joi.string()).default([]),
  registrationNumber: Joi.string().max(50).allow(''),
  experienceYears: Joi.number().min(0).default(0),
  bio: Joi.string().max(3000).allow(''),
  profileImage: Joi.string().allow(''),
  chambers: Joi.array().items(chamber).default([]),
  isVerified: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
});

const updateDoctor = createDoctor.fork(['name', 'specialty'], (schema) => schema.optional()).min(1);

const searchQuery = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  search: Joi.string().allow(''),
  specialty: Joi.string().allow(''),
  district: Joi.string().allow(''),
  upazilla: Joi.string().allow(''),
});

module.exports = { createDoctor, updateDoctor, searchQuery, chamber };
