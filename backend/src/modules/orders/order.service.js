'use strict';

const orderRepository = require('./order.repository');
const cartService = require('../cart/cart.service');
const customerService = require('../customers/customer.service');
const inventoryService = require('../inventory/inventory.service');
const ApiError = require('../../utils/apiError');
const { generateOrderNumber } = require('../../utils/crypto');
const { recordAudit } = require('../../utils/audit');
const { ORDER_STATUS, ORDER_STATUS_TRANSITIONS, PAYMENT_STATUS, PRESCRIPTION_STATUS } = require('../../constants/orderStatus');
const env = require('../../config/env');

async function resolveAddress(customerId, { addressId, address }) {
  if (address) return address;
  const profile = await customerService.getMyProfile(customerId);
  const found = addressId ? profile.addresses.id(addressId) : profile.addresses.find((a) => a.isDefault);
  if (!found) throw ApiError.badRequest('No valid delivery address found. Please provide one.');
  return {
    name: found.name,
    phone: found.phone,
    line1: found.line1,
    line2: found.line2,
    district: found.district,
    area: found.area,
    thana: found.thana,
    postCode: found.postCode,
  };
}

async function checkout(customerId, payload) {
  const cart = await cartService.getSummary(customerId);
  if (!cart.items || cart.items.length === 0) {
    throw ApiError.badRequest('Your cart is empty');
  }
  if (cart.hasUnavailableItem) {
    throw ApiError.badRequest('One or more items in your cart are no longer available in the requested quantity');
  }

  if (cart.requiresPrescription && !payload.prescriptionId) {
    throw ApiError.badRequest(
      'This order contains prescription-required medicines. Please attach a reviewed prescription.'
    );
  }

  let prescription = null;
  if (payload.prescriptionId) {
    const prescriptionService = require('../prescriptions/prescription.service');
    prescription = await prescriptionService.getRawById(payload.prescriptionId);
    if (!prescription) throw ApiError.notFound('Prescription not found');
    if (String(prescription.customer) !== String(customerId)) {
      throw ApiError.forbidden('This prescription does not belong to you');
    }
    // Ownership alone isn't enough - a freshly uploaded or still-under-review
    // prescription must not be accepted here, otherwise the order silently
    // gets created and only gets stuck later at the PROCESSING transition
    // (which does check status), well after the customer thinks checkout
    // succeeded.
    if (prescription.status !== PRESCRIPTION_STATUS.ACCEPTED) {
      throw ApiError.badRequest(
        'This prescription has not been accepted by a pharmacist yet. Please wait for review before checking out.'
      );
    }
  }

  const address = await resolveAddress(customerId, payload);

  // Reserve inventory for every line item (FEFO, atomic per-batch). Rolls
  // back everything reserved so far if any item can't be fully allocated.
  const allocations = [];
  try {
    for (const item of cart.items) {
      const itemAllocations = await inventoryService.reserveStock(item.product, item.quantity);
      allocations.push(...itemAllocations);
    }
  } catch (err) {
    await inventoryService.releaseAllocations(allocations);
    throw err;
  }

  try {
    let couponResult = { discount: 0, coupon: null };
    if (payload.couponCode) {
      const couponService = require('../coupons/coupon.service');
      couponResult = await couponService.validate(payload.couponCode, {
        customerId,
        subtotal: cart.subtotal,
      });
    }

    const deliveryCharge =
      payload.deliveryType === 'EXPRESS'
        ? env.delivery.defaultCharge * 2
        : cart.subtotal >= env.delivery.freeDeliveryThreshold
        ? 0
        : env.delivery.defaultCharge;

    const discountAmount = couponResult.discount || 0;
    const total = Math.max(0, cart.subtotal - discountAmount + deliveryCharge);

    const order = await orderRepository.create({
      orderNumber: generateOrderNumber(),
      customer: customerId,
      items: cart.items.map((i) => ({
        product: i.product,
        name: i.name,
        quantity: i.quantity,
        price: i.unitPrice,
        mrp: i.mrp,
        subtotal: i.lineTotal,
        prescriptionRequired: i.prescriptionRequired,
      })),
      prescription: prescription ? prescription._id : null,
      address,
      deliveryType: payload.deliveryType,
      deliveryDate: payload.deliveryDate,
      deliveryCharge,
      coupon: couponResult.coupon ? { code: couponResult.coupon.code, discountAmount } : { code: null, discountAmount: 0 },
      subtotal: cart.subtotal,
      discountAmount,
      total,
      notes: payload.notes,
      paymentMethod: payload.paymentMethod,
      paymentStatus: PAYMENT_STATUS.PENDING,
      status: ORDER_STATUS.PENDING,
      statusHistory: [{ status: ORDER_STATUS.PENDING, by: customerId }],
      inventoryAllocations: allocations,
    });

    if (couponResult.coupon) {
      const couponService = require('../coupons/coupon.service');
      await couponService.recordUsage(couponResult.coupon.code);
    }

    if (prescription) {
      const prescriptionService = require('../prescriptions/prescription.service');
      await prescriptionService.linkToOrder(prescription._id, order._id);
    }

    // Initiate payment (COD is recorded immediately with no gateway call).
    const paymentService = require('../payments/payment.service');
    const payment = await paymentService.initiateForOrder(order);
    order.payment = payment._id;
    await order.save();

    if (payload.recurring) {
      const recurringOrderService = require('../recurringOrders/recurringOrder.service');
      await recurringOrderService.createFromOrder(order, payload.recurringIntervalDays);
      order.isRecurring = true;
      await order.save();
    }

    await cartService.clearCart(customerId);

    const { enqueueOrderPlaced } = require('../../jobs/order.job');
    await enqueueOrderPlaced({ orderId: String(order._id) });

    await recordAudit({
      actorId: customerId,
      actorRole: 'CUSTOMER',
      action: 'ORDER_PLACED',
      entityType: 'Order',
      entityId: order._id,
      changes: { total: order.total, paymentMethod: order.paymentMethod },
    });

    return { order, payment };
  } catch (err) {
    await inventoryService.releaseAllocations(allocations);
    throw err;
  }
}

async function getRawById(id) {
  return orderRepository.findById(id);
}

async function getById(id, requester) {
  const order = await orderRepository.findById(id, {
    populate: [{ path: 'customer', select: 'name email phone' }, { path: 'items.product', select: 'name images' }],
  });
  if (!order) throw ApiError.notFound('Order not found');
  if (requester && requester.role === 'CUSTOMER' && String(order.customer._id || order.customer) !== String(requester.id)) {
    throw ApiError.forbidden('You do not have access to this order');
  }
  return order;
}

async function listMine(customerId, query) {
  return orderRepository.listForCustomer(customerId, query);
}

async function listAll(query) {
  return orderRepository.listAll(query);
}

function assertTransition(current, next) {
  const allowed = ORDER_STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw ApiError.badRequest(`Cannot transition order from ${current} to ${next}`);
  }
}

async function updateStatus(orderId, actor, { status, note }) {
  const order = await orderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  assertTransition(order.status, status);

  if (status === ORDER_STATUS.PROCESSING && order.prescription) {
    const prescriptionService = require('../prescriptions/prescription.service');
    const prescription = await prescriptionService.getRawById(order.prescription);
    if (prescription && !['VERIFIED', 'ACCEPTED', 'FULFILLED'].includes(prescription.status)) {
      throw ApiError.badRequest('This order cannot proceed until its prescription has been reviewed and accepted');
    }
  }

  const previousStatus = order.status;
  order.status = status;
  order.statusHistory.push({ status, by: actor?.id, note });

  if (status === ORDER_STATUS.PACKED && !order.inventoryCommitted) {
    await inventoryService.commitAllocations(order.inventoryAllocations);
    order.inventoryCommitted = true;
  }

  if (status === ORDER_STATUS.DELIVERED && order.paymentMethod === 'COD') {
    order.paymentStatus = PAYMENT_STATUS.PAID;
  }

  if (status === ORDER_STATUS.DISPATCHED) {
    const deliveryService = require('../delivery/delivery.service');
    await deliveryService.createForOrder(order);
  }

  if (status === ORDER_STATUS.CANCELLED) {
    if (!order.inventoryCommitted) {
      await inventoryService.releaseAllocations(order.inventoryAllocations);
    } else {
      await inventoryService.restockAllocations(order.inventoryAllocations);
    }
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    } else {
      order.paymentStatus = PAYMENT_STATUS.CANCELLED;
    }
  }

  if (status === ORDER_STATUS.RETURNED && order.inventoryCommitted) {
    await inventoryService.restockAllocations(order.inventoryAllocations);
  }

  await order.save();

  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'ORDER_STATUS_CHANGED',
    entityType: 'Order',
    entityId: order._id,
    changes: { from: previousStatus, to: status },
  });

  const { enqueueOrderStatusChanged } = require('../../jobs/order.job');
  await enqueueOrderStatusChanged({ orderId: String(order._id), previousStatus, newStatus: status });

  return order;
}

async function cancel(orderId, requester, reason) {
  const order = await orderRepository.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const isOwner = String(order.customer) === String(requester?.id);
  const canManage = requester?.role !== 'CUSTOMER';
  if (!isOwner && !canManage) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  return updateStatus(orderId, requester, { status: ORDER_STATUS.CANCELLED, note: reason });
}

module.exports = {
  checkout,
  getRawById,
  getById,
  listMine,
  listAll,
  updateStatus,
  cancel,
};
