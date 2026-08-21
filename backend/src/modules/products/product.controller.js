'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const productService = require('./product.service');

const create = asyncHandler(async (req, res) => {
  const product = await productService.create(req.body, req.user);
  return ApiResponse.created(res, product, 'Product created successfully');
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.update(req.params.id, req.body, req.user);
  return ApiResponse.ok(res, product, 'Product updated successfully');
});

const remove = asyncHandler(async (req, res) => {
  await productService.remove(req.params.id, req.user);
  return ApiResponse.ok(res, null, 'Product deleted successfully');
});

const getById = asyncHandler(async (req, res) => {
  const product = await productService.getById(req.params.id);
  return ApiResponse.ok(res, product);
});

const getBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getBySlug(req.params.slug);
  return ApiResponse.ok(res, product);
});

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.list(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const getRelated = asyncHandler(async (req, res) => {
  const related = await productService.getRelated(req.params.id, Number(req.query.limit) || 8);
  return ApiResponse.ok(res, related);
});

module.exports = { create, update, remove, getById, getBySlug, list, getRelated };
