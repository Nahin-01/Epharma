'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const genericService = require('./generic.service');
const { createController } = require('../../utils/crud.factory');

const base = createController(genericService, 'Generic');

const search = asyncHandler(async (req, res) => {
  const results = await genericService.search(req.query.q);
  return ApiResponse.ok(res, results);
});

module.exports = { ...base, search };
