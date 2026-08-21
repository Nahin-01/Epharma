'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const reportService = require('./report.service');

const sales = asyncHandler(async (req, res) => {
  const result = await reportService.salesReport(req.query);
  return ApiResponse.ok(res, result);
});

const inventory = asyncHandler(async (req, res) => {
  const result = await reportService.inventoryReport();
  return ApiResponse.ok(res, result);
});

const prescriptions = asyncHandler(async (req, res) => {
  const result = await reportService.prescriptionsReport(req.query);
  return ApiResponse.ok(res, result);
});

const delivery = asyncHandler(async (req, res) => {
  const result = await reportService.deliveryReport(req.query);
  return ApiResponse.ok(res, result);
});

const dashboard = asyncHandler(async (req, res) => {
  const result = await reportService.dashboardSummary();
  return ApiResponse.ok(res, result);
});

module.exports = { sales, inventory, prescriptions, delivery, dashboard };
