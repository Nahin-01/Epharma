'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const doctorService = require('./doctor.service');
const { createController } = require('../../utils/crud.factory');

const base = createController(doctorService, 'Doctor');

const search = asyncHandler(async (req, res) => {
  const { items, meta } = await doctorService.search(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const listSpecialties = asyncHandler(async (req, res) => {
  const specialties = await doctorService.listSpecialties();
  return ApiResponse.ok(res, specialties);
});

module.exports = { ...base, search, listSpecialties };
