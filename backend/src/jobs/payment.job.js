'use strict';

const { getQueue, QUEUE_NAMES } = require('./queue');
const logger = require('../utils/logger');

const queue = getQueue(QUEUE_NAMES.PAYMENT);

/** Enqueues an asynchronous verification poll for a gateway transaction (used when a webhook is delayed/missing). */
async function enqueueVerifyPayment({ paymentId }, opts = {}) {
  return queue.add('verify-payment', { paymentId }, { delay: opts.delayMs || 0 });
}

async function processor(job) {
  const paymentService = require('../modules/payments/payment.service');
  const { paymentId } = job.data;
  try {
    const result = await paymentService.reconcilePayment(paymentId);
    return result;
  } catch (err) {
    logger.error(`[payment-job] Failed to reconcile payment ${paymentId}: ${err.message}`);
    throw err;
  }
}

module.exports = { queue, enqueueVerifyPayment, processor };
