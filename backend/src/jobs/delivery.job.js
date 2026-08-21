'use strict';

const { getQueue, QUEUE_NAMES } = require('./queue');
const logger = require('../utils/logger');

const queue = getQueue(QUEUE_NAMES.DELIVERY);

async function enqueueCreateShipment({ deliveryId }) {
  return queue.add('create-shipment', { deliveryId });
}

async function enqueueSyncTracking({ deliveryId }) {
  return queue.add('sync-tracking', { deliveryId });
}

async function processor(job) {
  const deliveryService = require('../modules/delivery/delivery.service');
  const { deliveryId } = job.data;

  if (job.name === 'create-shipment') {
    return deliveryService.createShipmentForDelivery(deliveryId);
  }
  if (job.name === 'sync-tracking') {
    return deliveryService.syncTracking(deliveryId);
  }
  logger.warn(`[delivery-job] Unknown job name: ${job.name}`);
  return { skipped: true };
}

module.exports = { queue, enqueueCreateShipment, enqueueSyncTracking, processor };
