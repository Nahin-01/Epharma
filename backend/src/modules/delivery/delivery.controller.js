'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const deliveryService = require('./delivery.service');
const deliveryZoneService = require('./deliveryZone.service');
const { createController } = require('../../utils/crud.factory');

const getByOrder = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.getByOrder(req.params.orderId, req.user);
  return ApiResponse.ok(res, delivery);
});

const listAll = asyncHandler(async (req, res) => {
  const { items, meta } = await deliveryService.listAll(req.query);
  return ApiResponse.ok(res, items, 'Success', meta);
});

const syncTracking = asyncHandler(async (req, res) => {
  const delivery = await deliveryService.getByOrder(req.params.orderId, req.user);
  const updated = await deliveryService.syncTracking(delivery._id);
  return ApiResponse.ok(res, updated, 'Tracking synced');
});

const resolveCharge = asyncHandler(async (req, res) => {
  const charge = await deliveryService.resolveCharge(req.query.district, req.query.area);
  return ApiResponse.ok(res, { charge });
});

const zones = createController(deliveryZoneService, 'Delivery zone');

module.exports = { getByOrder, listAll, syncTracking, resolveCharge, zones };
