'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const service = require('./recurringOrder.service');

const listMine = asyncHandler(async (req, res) => {
  const schedules = await service.listMine(req.user.id);
  return ApiResponse.ok(res, schedules);
});

const getOne = asyncHandler(async (req, res) => {
  const schedule = await service.getOwned(req.params.id, req.user.id);
  return ApiResponse.ok(res, schedule);
});

const update = asyncHandler(async (req, res) => {
  const schedule = await service.updateSchedule(req.params.id, req.user.id, req.body);
  return ApiResponse.ok(res, schedule, 'Recurring order schedule updated');
});

const skipNext = asyncHandler(async (req, res) => {
  const schedule = await service.skipNext(req.params.id, req.user.id);
  return ApiResponse.ok(res, schedule, 'Next refill skipped');
});

const cancel = asyncHandler(async (req, res) => {
  const schedule = await service.cancel(req.params.id, req.user.id);
  return ApiResponse.ok(res, schedule, 'Recurring order cancelled');
});

const reorderToCart = asyncHandler(async (req, res) => {
  const summary = await service.reorderToCart(req.params.id, req.user.id);
  return ApiResponse.ok(res, summary, 'Items added to cart for reorder');
});

module.exports = { listMine, getOne, update, skipNext, cancel, reorderToCart };
