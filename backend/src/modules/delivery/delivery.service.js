'use strict';

const deliveryRepository = require('./delivery.repository');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');
const { getCourier } = require('../../integrations/courier');

async function createForOrder(order) {
  const existing = await deliveryRepository.findByOrder(order._id);
  if (existing) return existing;

  const delivery = await deliveryRepository.create({
    order: order._id,
    customer: order.customer,
    charge: order.deliveryCharge,
    codAmount: order.paymentMethod === 'COD' ? order.total : 0,
    status: 'PENDING',
  });

  const { enqueueCreateShipment } = require('../../jobs/delivery.job');
  await enqueueCreateShipment({ deliveryId: String(delivery._id) });

  return delivery;
}

async function createShipmentForDelivery(deliveryId) {
  const delivery = await deliveryRepository.findById(deliveryId, { populate: 'order' });
  if (!delivery) {
    logger.warn(`[delivery-service] Delivery ${deliveryId} not found`);
    return { skipped: true };
  }

  const order = delivery.order;
  const courier = getCourier();
  const result = await courier.createShipment({
    orderNumber: order.orderNumber,
    address: order.address,
    items: order.items,
    codAmount: delivery.codAmount,
  });

  delivery.courierProvider = result.provider;
  delivery.trackingId = result.trackingId;
  delivery.status = 'PICKUP_PENDING';
  delivery.estimatedDelivery = result.estimatedDelivery;
  delivery.history.push({ status: 'PICKUP_PENDING', raw: result });
  await delivery.save();

  return delivery;
}

async function syncTracking(deliveryId) {
  const delivery = await deliveryRepository.findById(deliveryId);
  if (!delivery || !delivery.trackingId) return { skipped: true };

  const courier = getCourier();
  const result = await courier.trackShipment(delivery.trackingId);

  const mappedStatus = mapCourierStatus(result.status);
  if (mappedStatus && mappedStatus !== delivery.status) {
    delivery.status = mappedStatus;
    delivery.history.push({ status: mappedStatus, raw: result });
    if (mappedStatus === 'DELIVERED') delivery.deliveredAt = new Date();
    await delivery.save();
  }

  return delivery;
}

function mapCourierStatus(rawStatus) {
  const value = String(rawStatus || '').toUpperCase();
  if (value.includes('DELIVER')) return 'DELIVERED';
  if (value.includes('TRANSIT')) return 'IN_TRANSIT';
  if (value.includes('OUT_FOR')) return 'OUT_FOR_DELIVERY';
  if (value.includes('PICK')) return 'PICKED_UP';
  if (value.includes('CANCEL')) return 'CANCELLED';
  if (value.includes('FAIL')) return 'FAILED';
  return null;
}

async function getByOrder(orderId, requester) {
  const delivery = await deliveryRepository.findByOrder(orderId);
  if (!delivery) throw ApiError.notFound('Delivery record not found for this order');
  if (requester && requester.role === 'CUSTOMER' && String(delivery.customer) !== String(requester.id)) {
    throw ApiError.forbidden('You do not have access to this delivery');
  }
  return delivery;
}

async function listAll(query) {
  return deliveryRepository.list({
    filter: query.status ? { status: query.status } : {},
    page: query.page,
    limit: query.limit,
    populate: [{ path: 'order', select: 'orderNumber total address' }, { path: 'customer', select: 'name phone' }],
  });
}

/** Resolves the delivery charge for an address using configured zones, falling back to the flat default. */
async function resolveCharge(district, area) {
  const deliveryZoneRepository = require('./deliveryZone.repository');
  const env = require('../../config/env');
  const zone = await deliveryZoneRepository.findForAddress(district, area);
  return zone ? zone.charge : env.delivery.defaultCharge;
}

module.exports = {
  createForOrder,
  createShipmentForDelivery,
  syncTracking,
  getByOrder,
  listAll,
  resolveCharge,
};
