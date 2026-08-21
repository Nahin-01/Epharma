'use strict';

const { getQueue, QUEUE_NAMES } = require('./queue');
const logger = require('../utils/logger');

const queue = getQueue(QUEUE_NAMES.RECURRING_ORDER);

async function enqueueScan() {
  return queue.add('scan-due-refills', {});
}

async function processor(job) {
  if (job.name !== 'scan-due-refills') {
    logger.warn(`[recurring-order-job] Unknown job name: ${job.name}`);
    return { skipped: true };
  }
  const recurringOrderService = require('../modules/recurringOrders/recurringOrder.service');
  return recurringOrderService.processDueReminders();
}

module.exports = { queue, enqueueScan, processor };
