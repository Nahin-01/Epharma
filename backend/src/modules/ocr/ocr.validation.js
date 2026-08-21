'use strict';

const Joi = require('joi');
const objectId = require('../../utils/objectId.validation');

const reprocess = Joi.object({
  prescriptionId: objectId.required(),
  fileId: objectId.required(),
});

module.exports = { reprocess };
