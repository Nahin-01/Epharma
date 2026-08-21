'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const inventoryService = require('./inventory.service');

const createBatch = asyncHandler(async (req, res) => {
  const batch = await inventoryService.createBatch(req.body, req.user);
  return ApiResponse.created(res, batch, 'Inventory batch created successfully');
});

const updateBatch = asyncHandler(async (req, res) => {
  const batch = await inventoryService.updateBatch(req.params.id, req.body, req.user);
  return ApiResponse.ok(res, batch, 'Inventory batch updated successfully');
});

const listBatches = asyncHandler(async (req, res) => {
  const { items, meta } = await inventoryService.listBatches(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const getBatch = asyncHandler(async (req, res) => {
  const batch = await inventoryService.getBatchById(req.params.id);
  return ApiResponse.ok(res, batch);
});

const scan = asyncHandler(async (req, res) => {
  const result = await inventoryService.scanLowStockAndExpiring();
  return ApiResponse.ok(res, result);
});

module.exports = { createBatch, updateBatch, listBatches, getBatch, scan };
