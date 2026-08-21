'use strict';

const couponRepository = require('./coupon.repository');
const { createService } = require('../../utils/crud.factory');
const ApiError = require('../../utils/apiError');

const base = createService(couponRepository, 'Coupon');

async function create(data) {
  const existing = await couponRepository.findByCode(data.code);
  if (existing) throw ApiError.conflict('A coupon with this code already exists');
  return couponRepository.create(data);
}

/**
 * Validates a coupon against the current cart/order subtotal and customer
 * usage history, and computes the resulting discount amount. Does not
 * mutate usedCount - callers should call `recordUsage` once the order is
 * actually placed (avoids double counting on repeated cart previews).
 */
async function validate(code, { customerId, subtotal }) {
  const coupon = await couponRepository.findByCode(code);
  if (!coupon || !coupon.isActive) throw ApiError.badRequest('Invalid coupon code');

  const now = new Date();
  if (coupon.startsAt > now) throw ApiError.badRequest('This coupon is not active yet');
  if (coupon.expiresAt < now) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (subtotal < coupon.minOrderAmount) {
    throw ApiError.badRequest(`This coupon requires a minimum order of ${coupon.minOrderAmount}`);
  }

  if (customerId && coupon.usageLimitPerCustomer) {
    const Order = require('../orders/order.model');
    const customerUsage = await Order.countDocuments({
      customer: customerId,
      'coupon.code': coupon.code,
      status: { $ne: 'CANCELLED' },
    });
    if (customerUsage >= coupon.usageLimitPerCustomer) {
      throw ApiError.badRequest('You have already used this coupon the maximum number of times');
    }
  }

  let discount = coupon.type === 'PERCENTAGE' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
    discount = Math.min(discount, coupon.maxDiscountAmount);
  }
  discount = Math.min(discount, subtotal);

  return { coupon, discount: Math.round(discount * 100) / 100 };
}

async function recordUsage(code) {
  await couponRepository.Model.updateOne({ code: String(code).toUpperCase() }, { $inc: { usedCount: 1 } });
}

module.exports = { ...base, create, validate, recordUsage };
