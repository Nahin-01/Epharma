'use strict';

const paymentRepository = require('./payment.repository');
const orderRepository = require('../orders/order.repository');
const ApiError = require('../../utils/apiError');
const { generateCode } = require('../../utils/crypto');
const { recordAudit } = require('../../utils/audit');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../../constants/orderStatus');
const { getGateway } = require('../../integrations/payments');
const env = require('../../config/env');

async function initiateForOrder(order) {
  if (order.paymentMethod === 'COD') {
    return paymentRepository.create({
      order: order._id,
      customer: order.customer,
      method: 'COD',
      provider: 'cod',
      amount: order.total,
      transactionId: generateCode('COD'),
      status: PAYMENT_STATUS.PENDING,
    });
  }

  const gateway = getGateway(order.paymentMethod);
  const result = await gateway.initiate({
    amount: order.total,
    currency: 'BDT',
    orderNumber: order.orderNumber,
    customer: { id: order.customer },
    callbackUrl: `${env.cors.frontendUrl}/orders/${order._id}/payment-callback`,
    successUrl: `${env.cors.frontendUrl}/orders/${order._id}/payment-callback?status=success`,
    failUrl: `${env.cors.frontendUrl}/orders/${order._id}/payment-callback?status=fail`,
    cancelUrl: `${env.cors.frontendUrl}/orders/${order._id}/payment-callback?status=cancel`,
  });

  return paymentRepository.create({
    order: order._id,
    customer: order.customer,
    method: order.paymentMethod,
    provider: result.provider,
    amount: order.total,
    transactionId: result.transactionId,
    gatewayResponse: result,
    status: PAYMENT_STATUS.PROCESSING,
  });
}

async function getByOrder(orderId, requester) {
  const payment = await paymentRepository.findByOrder(orderId);
  if (!payment) throw ApiError.notFound('Payment record not found for this order');
  if (requester && requester.role === 'CUSTOMER' && String(payment.customer) !== String(requester.id)) {
    throw ApiError.forbidden('You do not have access to this payment');
  }
  return payment;
}

async function markOrderPaidIfPending(order) {
  if (order.status === ORDER_STATUS.PENDING) {
    const orderService = require('../orders/order.service');
    await orderService.updateStatus(order._id, { id: order.customer, role: 'SYSTEM' }, { status: ORDER_STATUS.CONFIRMED, note: 'Auto-confirmed after successful payment' });
  }
}

async function handleGatewayResult(transactionId, verification) {
  const payment = await paymentRepository.findByTransactionId(transactionId);
  if (!payment) throw ApiError.notFound('Payment not found for this transaction');

  payment.status = verification.verified ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;
  payment.gatewayResponse = { ...payment.gatewayResponse, verification: verification.raw || verification };
  payment.completedAt = new Date();
  await payment.save();

  const order = await orderRepository.findById(payment.order);
  if (order) {
    order.paymentStatus = payment.status;
    await order.save();
    if (payment.status === PAYMENT_STATUS.PAID) {
      await markOrderPaidIfPending(order);
    }
  }

  await recordAudit({
    action: 'PAYMENT_VERIFIED',
    entityType: 'Payment',
    entityId: payment._id,
    changes: { status: payment.status },
  });

  return payment;
}

async function reconcilePayment(paymentId) {
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.method === 'COD') return payment;

  const gateway = getGateway(payment.method);
  const verification = await gateway.verify(payment.transactionId);
  return handleGatewayResult(payment.transactionId, verification);
}

/** Dev-only helper backing the mock gateway's redirectUrl so checkout can be fully exercised without real credentials. */
async function completeMockPayment(transactionId) {
  const gateway = getGateway('MOCK');
  const verification = await gateway.verify(transactionId);
  return handleGatewayResult(transactionId, verification);
}

async function refund(paymentId, amount, actor) {
  const payment = await paymentRepository.findById(paymentId);
  if (!payment) throw ApiError.notFound('Payment not found');
  if (payment.status !== PAYMENT_STATUS.PAID) {
    throw ApiError.badRequest('Only paid payments can be refunded');
  }

  const gateway = getGateway(payment.method === 'COD' ? 'MOCK' : payment.method);
  const result = await gateway.refund({ transactionId: payment.transactionId, amount });

  payment.refunds.push({ amount, transactionId: result.refundTransactionId, status: result.status });
  payment.status = PAYMENT_STATUS.REFUNDED;
  await payment.save();

  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'PAYMENT_REFUNDED',
    entityType: 'Payment',
    entityId: payment._id,
    changes: { amount },
  });

  return payment;
}

async function listAll(query) {
  return paymentRepository.list({
    filter: query.status ? { status: query.status } : {},
    page: query.page,
    limit: query.limit,
    populate: [{ path: 'order', select: 'orderNumber total' }, { path: 'customer', select: 'name email phone' }],
  });
}

module.exports = {
  initiateForOrder,
  getByOrder,
  handleGatewayResult,
  reconcilePayment,
  completeMockPayment,
  refund,
  listAll,
};
