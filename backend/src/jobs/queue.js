'use strict';

const { Queue } = require('bullmq');
const { getRedisConnection } = require('../config/redis');
const logger = require('../utils/logger');

const QUEUE_NAMES = Object.freeze({
  OCR: 'ocr-queue',
  NOTIFICATION: 'notification-queue',
  ORDER: 'order-queue',
  PAYMENT: 'payment-queue',
  DELIVERY: 'delivery-queue',
  INVENTORY: 'inventory-queue',
  RECURRING_ORDER: 'recurring-order-queue',
});

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: { count: 500, age: 24 * 3600 },
  removeOnFail: { count: 1000 },
};

const queues = new Map();

function getQueue(name) {
  if (queues.has(name)) return queues.get(name);
  const queue = new Queue(name, { connection: getRedisConnection(), defaultJobOptions });
  queue.on('error', (err) => logger.error(`Queue "${name}" error: ${err.message}`));
  queues.set(name, queue);
  return queue;
}

module.exports = { getQueue, QUEUE_NAMES, defaultJobOptions };
