'use strict';

const rateLimit = require('express-rate-limit');
const env = require('../config/env');

function buildLimiter({ windowMinutes = env.rateLimit.windowMinutes, max = env.rateLimit.max, message } = {}) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later.',
    },
  });
}

const globalRateLimiter = buildLimiter();

const authRateLimiter = buildLimiter({
  windowMinutes: 15,
  max: 20,
  message: 'Too many authentication attempts, please try again later.',
});

const otpRateLimiter = buildLimiter({
  windowMinutes: 10,
  max: 5,
  message: 'Too many OTP requests, please try again later.',
});

module.exports = { buildLimiter, globalRateLimiter, authRateLimiter, otpRateLimiter };
