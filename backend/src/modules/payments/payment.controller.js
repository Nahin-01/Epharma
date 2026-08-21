'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const paymentService = require('./payment.service');
const { getGateway } = require('../../integrations/payments');

const getByOrder = asyncHandler(async (req, res) => {
  const payment = await paymentService.getByOrder(req.params.orderId, req.user);
  return ApiResponse.ok(res, payment);
});

const listAll = asyncHandler(async (req, res) => {
  const { items, meta } = await paymentService.listAll(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const refund = asyncHandler(async (req, res) => {
  const payment = await paymentService.refund(req.params.id, req.body.amount, req.user);
  return ApiResponse.ok(res, payment, 'Refund processed');
});

/** Generic callback endpoint gateways redirect/POST to after a payment attempt. */
const callback = asyncHandler(async (req, res) => {
  const provider = req.params.provider.toUpperCase();
  const transactionId = req.body.transactionId || req.query.transactionId || req.body.paymentID || req.query.val_id;
  const gateway = getGateway(provider);
  const verification = await gateway.verify(transactionId);
  const payment = await paymentService.handleGatewayResult(transactionId, verification);
  return ApiResponse.ok(res, payment, 'Payment callback processed');
});

/** Dev convenience endpoint used by the mock gateway's redirectUrl. */
const mockComplete = asyncHandler(async (req, res) => {
  const payment = await paymentService.completeMockPayment(req.params.transactionId);
  return ApiResponse.ok(res, payment, 'Mock payment completed');
});

module.exports = { getByOrder, listAll, refund, callback, mockComplete };
