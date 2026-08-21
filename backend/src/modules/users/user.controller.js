'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const userService = require('./user.service');

const createStaffUser = asyncHandler(async (req, res) => {
  const user = await userService.createStaffUser(req.body, req.user);
  return ApiResponse.created(res, user, 'Staff user created successfully');
});

const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await userService.listUsers(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.ok(res, user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  return ApiResponse.ok(res, user, 'User updated successfully');
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(req.params.id, req.user);
  return ApiResponse.ok(res, user, 'User deactivated successfully');
});

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  return ApiResponse.ok(res, user);
});

module.exports = { createStaffUser, listUsers, getUser, updateUser, deactivateUser, getMe };
