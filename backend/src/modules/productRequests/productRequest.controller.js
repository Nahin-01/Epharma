'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const service = require('./productRequest.service');

const create = asyncHandler(async (req, res) => {
  const request = await service.create(req.user.id, req.body);
  return ApiResponse.created(res, request, 'Product request submitted successfully');
});

const listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listMine(req.user.id, req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const listAll = asyncHandler(async (req, res) => {
  const { items, meta } = await service.listAll(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const getById = asyncHandler(async (req, res) => {
  const request = await service.getById(req.params.id, req.user);
  return ApiResponse.ok(res, request);
});

const updateStatus = asyncHandler(async (req, res) => {
  const request = await service.updateStatus(req.params.id, req.user, req.body);
  return ApiResponse.ok(res, request, 'Product request updated');
});

module.exports = { create, listMine, listAll, getById, updateStatus };
