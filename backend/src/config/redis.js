'use strict';

const IORedis = require('ioredis');
const env = require('../config/env');
const logger = require('../utils/logger');

let connection = null;

/**
 * Shared ioredis connection factory. BullMQ requires maxRetriesPerRequest to
 * be null on connections used by Queues/Workers.
 */
function getRedisConnection() {
  if (connection) return connection;

  connection = new IORedis(env.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  connection.on('error', (err) => {
    logger.error(`Redis connection error: ${err.message}`);
  });
  connection.on('connect', () => {
    logger.info('Redis connected');
  });

  return connection;
}

module.exports = { getRedisConnection };
