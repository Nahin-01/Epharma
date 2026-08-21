'use strict';

const cartRepository = require('./cart.repository');
const productService = require('../products/product.service');
const ApiError = require('../../utils/apiError');
const env = require('../../config/env');

async function getOrCreateCart(customerId) {
  let cart = await cartRepository.findByCustomer(customerId);
  if (!cart) cart = await cartRepository.createForCustomer(customerId);
  return cart;
}

async function addItem(customerId, { product: productId, quantity }) {
  await productService.checkAvailability(productId, quantity);

  const cart = await getOrCreateCart(customerId);
  const existing = cart.items.find((i) => String(i.product) === String(productId));
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();
  return getSummary(customerId);
}

async function updateItem(customerId, productId, quantity) {
  const cart = await getOrCreateCart(customerId);
  const idx = cart.items.findIndex((i) => String(i.product) === String(productId));
  if (idx === -1) throw ApiError.notFound('Item not found in cart');

  if (quantity === 0) {
    cart.items.splice(idx, 1);
  } else {
    await productService.checkAvailability(productId, quantity);
    cart.items[idx].quantity = quantity;
  }
  await cart.save();
  return getSummary(customerId);
}

async function removeItem(customerId, productId) {
  const cart = await getOrCreateCart(customerId);
  cart.items = cart.items.filter((i) => String(i.product) !== String(productId));
  await cart.save();
  return getSummary(customerId);
}

async function clearCart(customerId) {
  const cart = await getOrCreateCart(customerId);
  cart.items = [];
  cart.couponCode = null;
  await cart.save();
  return getSummary(customerId);
}

async function setCoupon(customerId, code) {
  const cart = await getOrCreateCart(customerId);
  cart.couponCode = code ? String(code).toUpperCase() : null;
  await cart.save();
  return getSummary(customerId);
}

async function setNotes(customerId, notes) {
  const cart = await getOrCreateCart(customerId);
  cart.notes = notes;
  await cart.save();
  return getSummary(customerId);
}

/**
 * Computes a live cart summary: current prices, availability flags,
 * prescription requirement, coupon discount preview, delivery charge
 * estimate and grand total. Used both by the cart endpoints and by
 * order.service.checkout as the source of truth for what is being ordered.
 */
async function getSummary(customerId) {
  const cart = await cartRepository.findByCustomerPopulated(customerId);
  if (!cart) return buildEmptySummary();

  const items = [];
  let subtotal = 0;
  let requiresPrescription = false;
  let hasUnavailableItem = false;

  for (const item of cart.items) {
    const product = item.product;
    if (!product) continue;
    const lineAvailable = product.status === 'ACTIVE' && product.stockQuantity >= item.quantity;
    if (!lineAvailable) hasUnavailableItem = true;
    if (product.prescriptionRequired) requiresPrescription = true;

    const lineTotal = product.sellingPrice * item.quantity;
    subtotal += lineTotal;

    items.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0] || null,
      unitPrice: product.sellingPrice,
      mrp: product.mrp,
      quantity: item.quantity,
      lineTotal,
      prescriptionRequired: product.prescriptionRequired,
      available: lineAvailable,
      stockQuantity: product.stockQuantity,
    });
  }

  let couponDiscount = 0;
  let couponError = null;
  if (cart.couponCode && subtotal > 0) {
    try {
      const couponService = require('../coupons/coupon.service');
      const result = await couponService.validate(cart.couponCode, { customerId, subtotal });
      couponDiscount = result.discount;
    } catch (err) {
      couponError = err.message;
    }
  }

  const deliveryCharge = subtotal === 0 || subtotal >= env.delivery.freeDeliveryThreshold ? 0 : env.delivery.defaultCharge;
  const total = Math.max(0, subtotal - couponDiscount + deliveryCharge);

  return {
    cartId: cart._id,
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    couponCode: cart.couponCode,
    couponDiscount,
    couponError,
    deliveryCharge,
    total,
    requiresPrescription,
    hasUnavailableItem,
    notes: cart.notes || '',
  };
}

function buildEmptySummary() {
  return {
    cartId: null,
    items: [],
    itemCount: 0,
    subtotal: 0,
    couponCode: null,
    couponDiscount: 0,
    couponError: null,
    deliveryCharge: 0,
    total: 0,
    requiresPrescription: false,
    hasUnavailableItem: false,
    notes: '',
  };
}

module.exports = { getOrCreateCart, addItem, updateItem, removeItem, clearCart, setCoupon, setNotes, getSummary };
