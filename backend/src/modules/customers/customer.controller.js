'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const customerService = require('./customer.service');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await customerService.getMyProfile(req.user.id);
  return ApiResponse.ok(res, profile);
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await customerService.updateProfile(req.user.id, req.body);
  return ApiResponse.ok(res, profile, 'Profile updated successfully');
});

const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await customerService.listAddresses(req.user.id);
  return ApiResponse.ok(res, addresses);
});

const addAddress = asyncHandler(async (req, res) => {
  const address = await customerService.addAddress(req.user.id, req.body);
  return ApiResponse.created(res, address, 'Address added successfully');
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await customerService.updateAddress(req.user.id, req.params.addressId, req.body);
  return ApiResponse.ok(res, address, 'Address updated successfully');
});

const deleteAddress = asyncHandler(async (req, res) => {
  await customerService.deleteAddress(req.user.id, req.params.addressId);
  return ApiResponse.ok(res, null, 'Address removed successfully');
});

const listCustomers = asyncHandler(async (req, res) => {
  const { items, meta } = await customerService.listCustomers(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  return ApiResponse.ok(res, customer);
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listCustomers,
  getCustomer,
};
