'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');

/**
 * SMS provider abstraction. "mock" (default) simply logs the message so OTP
 * and notification flows work fully offline in development. Swap
 * SMS_PROVIDER to "twilio" (real, see sendTwilio) or another aggregator.
 */
async function sendMock(to, message) {
  logger.info(`[SMS:mock] -> ${to}: ${message}`);
  return { provider: 'mock', to, status: 'SENT', messageId: `mock-${Date.now()}` };
}

/** Bangladesh-friendly E.164 normalization: Twilio rejects anything else. */
function toE164(phone) {
  const digits = String(phone).replace(/[^0-9+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('880')) return `+${digits}`;
  if (digits.startsWith('0')) return `+880${digits.slice(1)}`;
  return `+${digits}`;
}

async function sendTwilio(to, message) {
  if (!env.sms.apiKey || !env.sms.apiSecret || !env.sms.fromNumber) {
    logger.warn('Twilio credentials or SMS_FROM_NUMBER missing, falling back to mock');
    return sendMock(to, message);
  }
  try {
    const body = new URLSearchParams({
      To: toE164(to),
      From: env.sms.fromNumber,
      Body: message,
    });
    const { data } = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${env.sms.apiKey}/Messages.json`,
      body,
      {
        auth: { username: env.sms.apiKey, password: env.sms.apiSecret },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );
    return { provider: 'twilio', to, status: 'SENT', messageId: data.sid, raw: data };
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    logger.error(`Twilio SMS send failed: ${detail}`);
    throw new Error(`Twilio SMS send failed: ${detail}`);
  }
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
  if (env.sms.provider === 'twilio') return sendTwilio(to, message);
  return sendGeneric(to, message);
}

module.exports = { sendSms };
