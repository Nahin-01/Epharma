'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const adminService = require('./admin.service');

const listAuditLogs = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listAuditLogs(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const listRoles = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, adminService.listRoles());
});

const listPermissions = asyncHandler(async (req, res) => {
  return ApiResponse.ok(res, adminService.listPermissions());
});

module.exports = { listAuditLogs, listRoles, listPermissions };
