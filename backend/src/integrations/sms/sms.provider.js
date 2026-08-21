'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * SMS provider abstraction. "mock" (default) simply logs the message so OTP
 * and notification flows work fully offline in development. Swap
 * SMS_PROVIDER to a real aggregator (Twilio, BulkSMSBD, etc.) and fill in
 * the request shape for that provider's API.
 */
async function sendMock(to, message) {
  logger.info(`[SMS:mock] -> ${to}: ${message}`);
  return { provider: 'mock', to, status: 'SENT', messageId: `mock-${Date.now()}` };
}

async function sendGeneric(to, message) {
  if (!env.sms.apiKey || !env.sms.apiSecret) {
    logger.warn('SMS provider credentials missing, falling back to mock');
    return sendMock(to, message);
  }
  try {
    // Generic REST aggregator shape; adjust to the concrete provider's API.
    const { data } = await axios.post('https://api.smsprovider.example.com/send', {
      api_key: env.sms.apiKey,
      api_secret: env.sms.apiSecret,
      sender_id: env.sms.senderId,
      to,
      message,
    });
    return { provider: env.sms.provider, to, status: 'SENT', raw: data };
  } catch (err) {
    logger.error(`SMS send failed: ${err.message}`);
    throw err;
  }
}

async function sendSms(to, message) {
  if (env.sms.provider === 'mock') return sendMock(to, message);
  return sendGeneric(to, message);
}

module.exports = { sendSms };
