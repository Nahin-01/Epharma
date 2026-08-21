'use strict';

const Joi = require('joi');

const dateRangeQuery = Joi.object({
  from: Joi.date().optional(),
  to: Joi.date().optional(),
});

module.exports = { dateRangeQuery };
