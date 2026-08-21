'use strict';

const { getQueue, QUEUE_NAMES } = require('./queue');
const logger = require('../utils/logger');

const queue = getQueue(QUEUE_NAMES.INVENTORY);

/** Enqueues a release of reserved stock (e.g. cart/order expired or was cancelled). */
async function enqueueReleaseReservedStock({ orderId }) {
  return queue.add('release-reserved-stock', { orderId });
}

/** Enqueues a scan for low-stock / near-expiry batches (scheduled repeatable job). */
async function enqueueExpiryScan() {
  return queue.add('expiry-scan', {});
}

async function processor(job) {
  const inventoryService = require('../modules/inventory/inventory.service');

  if (job.name === 'release-reserved-stock') {
    const { orderId } = job.data;
    return inventoryService.releaseReservationsForOrder(orderId);
  }

  if (job.name === 'expiry-scan') {
    return inventoryService.scanLowStockAndExpiring();
  }

  logger.warn(`[inventory-job] Unknown job name: ${job.name}`);
  return { skipped: true };
}

module.exports = { queue, enqueueReleaseReservedStock, enqueueExpiryScan, processor };
