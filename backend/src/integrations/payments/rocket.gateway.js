'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const mockGateway = require('./mock.gateway');

const cfg = env.payments.rocket;

function isConfigured() {
  return Boolean(cfg.merchantId && cfg.apiKey && cfg.apiSecret && cfg.baseUrl);
}

async function initiate({ amount, orderNumber, callbackUrl }) {
  if (!isConfigured()) {
    logger.warn('Rocket not configured, falling back to mock gateway');
    return mockGateway.initiate({ amount, orderNumber });
  }
  try {
    const { data } = await axios.post(
      `${cfg.baseUrl}/payments/initiate`,
      {
        merchantId: cfg.merchantId,
        amount,
        invoiceNumber: orderNumber,
        callbackUrl,
      },
      { headers: { 'X-API-KEY': cfg.apiKey, 'X-API-SECRET': cfg.apiSecret } }
    );
    return {
      provider: 'rocket',
      transactionId: data.transactionId || orderNumber,
      status: 'PROCESSING',
      amount,
      orderNumber,
      redirectUrl: data.paymentUrl,
      raw: data,
    };
  } catch (err) {
    logger.error(`Rocket initiate failed: ${err.message}`);
    throw err;
  }
}

async function verify(transactionId) {
  if (!isConfigured()) return mockGateway.verify(transactionId);
  try {
    const { data } = await axios.get(`${cfg.baseUrl}/payments/${transactionId}/status`, {
      headers: { 'X-API-KEY': cfg.apiKey, 'X-API-SECRET': cfg.apiSecret },
    });
    const success = data.status === 'SUCCESS';
    return {
      provider: 'rocket',
      transactionId,
      status: success ? 'PAID' : 'FAILED',
      verified: success,
      raw: data,
    };
  } catch (err) {
    logger.error(`Rocket verify failed: ${err.message}`);
    throw err;
  }
}

async function refund({ transactionId, amount }) {
  if (!isConfigured()) return mockGateway.refund({ transactionId, amount });
  try {
    const { data } = await axios.post(
      `${cfg.baseUrl}/payments/${transactionId}/refund`,
      { amount },
      { headers: { 'X-API-KEY': cfg.apiKey, 'X-API-SECRET': cfg.apiSecret } }
    );
    return {
      provider: 'rocket',
      transactionId,
      refundTransactionId: data.refundId,
      amount,
      status: data.status === 'SUCCESS' ? 'REFUNDED' : 'FAILED',
      raw: data,
    };
  } catch (err) {
    logger.error(`Rocket refund failed: ${err.message}`);
    throw err;
  }
}

module.exports = { name: 'rocket', isConfigured, initiate, verify, refund };
