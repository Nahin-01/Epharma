'use strict';

const recurringOrderRepository = require('./recurringOrder.repository');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');

async function createFromOrder(order, intervalDays = 30) {
  return recurringOrderRepository.create({
    customer: order.customer,
    sourceOrder: order._id,
    items: order.items.map((i) => ({ product: i.product, name: i.name, quantity: i.quantity })),
    address: order.address,
    deliveryType: order.deliveryType,
    paymentMethod: order.paymentMethod,
    intervalDays,
    nextRefillDate: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000),
    status: 'ACTIVE',
  });
}

async function listMine(customerId) {
  return recurringOrderRepository.listForCustomer(customerId);
}

async function getOwned(id, customerId) {
  const schedule = await recurringOrderRepository.findById(id);
  if (!schedule) throw ApiError.notFound('Recurring order schedule not found');
  if (String(schedule.customer) !== String(customerId)) {
    throw ApiError.forbidden('You do not have access to this recurring order');
  }
  return schedule;
}

async function updateSchedule(id, customerId, data) {
  const schedule = await getOwned(id, customerId);
  Object.assign(schedule, data);
  await schedule.save();
  return schedule;
}

async function skipNext(id, customerId) {
  const schedule = await getOwned(id, customerId);
  schedule.nextRefillDate = new Date(schedule.nextRefillDate.getTime() + schedule.intervalDays * 24 * 60 * 60 * 1000);
  await schedule.save();
  return schedule;
}

async function cancel(id, customerId) {
  return updateSchedule(id, customerId, { status: 'CANCELLED' });
}

/**
 * Adds every item from a recurring schedule back into the customer's cart
 * so they can review/checkout normally (including attaching a fresh
 * prescription if required). Intentionally does not silently auto-place or
 * auto-charge an order.
 */
async function reorderToCart(id, customerId) {
  const schedule = await getOwned(id, customerId);
  const cartService = require('../cart/cart.service');
  for (const item of schedule.items) {
    await cartService.addItem(customerId, { product: item.product, quantity: item.quantity });
  }
  return cartService.getSummary(customerId);
}

/**
 * Runs on a daily repeatable BullMQ job. Sends a refill reminder
 * notification for every due schedule and advances nextRefillDate.
 */
async function processDueReminders() {
  const due = await recurringOrderRepository.findDue();
  const notificationService = require('../notifications/notification.service');

  let sent = 0;
  for (const schedule of due) {
    const itemNames = schedule.items.map((i) => `${i.name} x${i.quantity}`).join(', ');
    const message = `Time to reorder your recurring medicines: ${itemNames}`;
    try {
      await notificationService.notifyCustomer(schedule.customer, {
        title: 'Recurring order reminder',
        message,
        type: 'RECURRING_ORDER',
        referenceId: schedule._id,
      });
      schedule.notificationHistory.push({ message });
      schedule.nextRefillDate = new Date(Date.now() + schedule.intervalDays * 24 * 60 * 60 * 1000);
      await schedule.save();
      sent += 1;
    } catch (err) {
      logger.error(`[recurring-order] Failed to notify schedule ${schedule._id}: ${err.message}`);
    }
  }
  return { scanned: due.length, remindersSent: sent };
}

module.exports = {
  createFromOrder,
  listMine,
  getOwned,
  updateSchedule,
  skipNext,
  cancel,
  reorderToCart,
  processDueReminders,
};
