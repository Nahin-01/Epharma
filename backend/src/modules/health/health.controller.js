'use strict';

const mongoose = require('mongoose');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const env = require('../../config/env');

const MONGO_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

const check = asyncHandler(async (req, res) => {
  const mongoState = MONGO_STATES[mongoose.connection.readyState] || 'unknown';

  let redisState = 'unknown';
  try {
    const { getRedisConnection } = require('../../config/redis');
    redisState = getRedisConnection().status;
  } catch (err) {
    redisState = 'error';
  }

  const healthy = mongoState === 'connected';

  return ApiResponse.send(res, {
    statusCode: healthy ? 200 : 503,
    message: healthy ? 'OK' : 'Service degraded',
    data: {
      status: healthy ? 'ok' : 'degraded',
      uptimeSeconds: Math.round(process.uptime()),
      environment: env.nodeEnv,
      dependencies: { mongodb: mongoState, redis: redisState },
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = { check };
