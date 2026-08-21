'use strict';

const { Worker } = require('bullmq');
const env = require('../config/env');
const logger = require('../utils/logger');
const { getRedisConnection } = require('../config/redis');
const { connectDB } = require('../config/database');
const { QUEUE_NAMES } = require('./queue');

const ocrJob = require('./prescriptionOCR.job');
const notificationJob = require('./notification.job');
const orderJob = require('./order.job');
const paymentJob = require('./payment.job');
const deliveryJob = require('./delivery.job');
const inventoryJob = require('./inventory.job');
const recurringOrderJob = require('./recurringOrder.job');

const JOB_MODULES = [
  [QUEUE_NAMES.OCR, ocrJob],
  [QUEUE_NAMES.NOTIFICATION, notificationJob],
  [QUEUE_NAMES.ORDER, orderJob],
  [QUEUE_NAMES.PAYMENT, paymentJob],
  [QUEUE_NAMES.DELIVERY, deliveryJob],
  [QUEUE_NAMES.INVENTORY, inventoryJob],
  [QUEUE_NAMES.RECURRING_ORDER, recurringOrderJob],
];

async function start() {
  await connectDB();

  const workers = JOB_MODULES.map(([name, mod]) => {
    const worker = new Worker(name, mod.processor, {
      connection: getRedisConnection(),
      concurrency: 5,
    });
    worker.on('completed', (job) => logger.info(`[${name}] job ${job.id} (${job.name}) completed`));
    worker.on('failed', (job, err) =>
      logger.error(`[${name}] job ${job?.id} (${job?.name}) failed: ${err.message}`)
    );
    return worker;
  });

  // Schedule the recurring inventory expiry/low-stock scan every 6 hours.
  await inventoryJob.queue.add(
    'expiry-scan',
    {},
    { repeat: { every: 6 * 60 * 60 * 1000 }, jobId: 'expiry-scan-repeatable' }
  );

  // Schedule the recurring-order refill reminder scan once a day.
  await recurringOrderJob.queue.add(
    'scan-due-refills',
    {},
    { repeat: { every: 24 * 60 * 60 * 1000 }, jobId: 'recurring-refill-scan-repeatable' }
  );

  logger.info(`ePharmacy background workers started (${workers.length} queues) in ${env.nodeEnv} mode`);

  const shutdown = async () => {
    logger.info('Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  logger.error(`Failed to start workers: ${err.stack || err.message}`);
  process.exit(1);
});
