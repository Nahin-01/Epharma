'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const orderService = require('./order.service');

const checkout = asyncHandler(async (req, res) => {
  const result = await orderService.checkout(req.user.id, req.body);
  return ApiResponse.created(res, result, 'Order placed successfully');
});

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.getById(req.params.id, req.user);
  return ApiResponse.ok(res, order);
});

const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await orderService.listMine(req.user.id, req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const listAll = asyncHandler(async (req, res) => {
  const { items, meta } = await orderService.listAll(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, order, 'Order status updated');
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancel(req.params.id, req.user, req.body.reason);
  return ApiResponse.ok(res, order, 'Order cancelled');
});

module.exports = { checkout, getById, listMine, listAll, updateStatus, cancel };
