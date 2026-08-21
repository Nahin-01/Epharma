'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const cartService = require('./cart.service');

const getCart = asyncHandler(async (req, res) => {
  const summary = await cartService.getSummary(req.user.id);
  return ApiResponse.ok(res, summary);
});

const addItem = asyncHandler(async (req, res) => {
  const summary = await cartService.addItem(req.user.id, req.body);
  return ApiResponse.ok(res, summary, 'Item added to cart');
});

const updateItem = asyncHandler(async (req, res) => {
  const summary = await cartService.updateItem(req.user.id, req.params.productId, req.body.quantity);
  return ApiResponse.ok(res, summary, 'Cart updated');
});

const removeItem = asyncHandler(async (req, res) => {
  const summary = await cartService.removeItem(req.user.id, req.params.productId);
  return ApiResponse.ok(res, summary, 'Item removed from cart');
});

const clearCart = asyncHandler(async (req, res) => {
  const summary = await cartService.clearCart(req.user.id);
  return ApiResponse.ok(res, summary, 'Cart cleared');
});

const applyCoupon = asyncHandler(async (req, res) => {
  const summary = await cartService.setCoupon(req.user.id, req.body.code);
  return ApiResponse.ok(res, summary, req.body.code ? 'Coupon applied' : 'Coupon removed');
});

const setNotes = asyncHandler(async (req, res) => {
  const summary = await cartService.setNotes(req.user.id, req.body.notes);
  return ApiResponse.ok(res, summary, 'Notes updated');
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, setNotes };
