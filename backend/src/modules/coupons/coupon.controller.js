'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const couponService = require('./coupon.service');
const { createController } = require('../../utils/crud.factory');

const base = createController(couponService, 'Coupon');

const preview = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const { discount, coupon } = await couponService.validate(code, {
    customerId: req.user.id,
    subtotal: Number(subtotal) || 0,
  });
  return ApiResponse.ok(res, { code: coupon.code, discount, type: coupon.type, value: coupon.value });
});

module.exports = { ...base, preview };
