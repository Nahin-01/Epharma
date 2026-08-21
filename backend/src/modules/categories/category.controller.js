'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const categoryService = require('./category.service');
const { createController } = require('../../utils/crud.factory');

const base = createController(categoryService, 'Category');

const getTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getTree({ activeOnly: req.query.activeOnly !== 'false' });
  return ApiResponse.ok(res, tree);
});

module.exports = { ...base, getTree };
