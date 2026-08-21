'use strict';

const { getQueue, QUEUE_NAMES } = require('./queue');
const logger = require('../utils/logger');

const queue = getQueue(QUEUE_NAMES.ORDER);

/** Enqueues post-order-placement side effects (notify customer, generate recurring schedule, etc). */
async function enqueueOrderPlaced({ orderId }) {
  return queue.add('order-placed', { orderId });
}

async function enqueueOrderStatusChanged({ orderId, previousStatus, newStatus }) {
  return queue.add('order-status-changed', { orderId, previousStatus, newStatus });
}

async function processor(job) {
  const notificationService = require('../modules/notifications/notification.service');
  const orderService = require('../modules/orders/order.service');

  if (job.name === 'order-placed') {
    const { orderId } = job.data;
    const order = await orderService.getRawById(orderId);
    if (!order) return { skipped: true };
    await notificationService.notifyCustomer(order.customer, {
      title: 'Order placed',
      message: `Your order ${order.orderNumber} has been placed and is pending confirmation.`,
      type: 'ORDER',
      referenceId: order._id,
    });
    return { notified: true };
  }

  if (job.name === 'order-status-changed') {
    const { orderId, newStatus } = job.data;
    const order = await orderService.getRawById(orderId);
    if (!order) return { skipped: true };
    await notificationService.notifyCustomer(order.customer, {
      title: 'Order update',
      message: `Your order ${order.orderNumber} is now ${newStatus}.`,
      type: 'ORDER',
      referenceId: order._id,
    });
    return { notified: true };
  }

  logger.warn(`[order-job] Unknown job name: ${job.name}`);
  return { skipped: true };
}

module.exports = { queue, enqueueOrderPlaced, enqueueOrderStatusChanged, processor };
