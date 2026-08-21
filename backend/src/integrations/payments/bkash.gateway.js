'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const mockGateway = require('./mock.gateway');

const cfg = env.payments.bkash;
let cachedToken = null;
let cachedTokenExpiresAt = 0;

function isConfigured() {
  return Boolean(cfg.appKey && cfg.appSecret && cfg.username && cfg.password && cfg.baseUrl);
}

async function getToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;
  const { data } = await axios.post(
    `${cfg.baseUrl}/tokenized/checkout/token/grant`,
    { app_key: cfg.appKey, app_secret: cfg.appSecret },
    {
      headers: {
        username: cfg.username,
        password: cfg.password,
        'Content-Type': 'application/json',
      },
    }
  );
  cachedToken = data.id_token;
  cachedTokenExpiresAt = Date.now() + (Number(data.expires_in) || 3300) * 1000;
  return cachedToken;
}

async function initiate({ amount, orderNumber, callbackUrl }) {
  if (!isConfigured()) {
    logger.warn('bKash not configured, falling back to mock gateway');
    return mockGateway.initiate({ amount, orderNumber });
  }
  try {
    const token = await getToken();
    const { data } = await axios.post(
      `${cfg.baseUrl}/tokenized/checkout/create`,
      {
        mode: '0011',
        payerReference: orderNumber,
        callbackURL: callbackUrl,
        amount: String(amount),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: orderNumber,
      },
      {
        headers: {
          Authorization: token,
          'X-APP-Key': cfg.appKey,
          'Content-Type': 'application/json',
        },
      }
    );
    return {
      provider: 'bkash',
      transactionId: data.paymentID,
      status: 'PROCESSING',
      amount,
      orderNumber,
      redirectUrl: data.bkashURL,
      raw: data,
    };
  } catch (err) {
    logger.error(`bKash initiate failed: ${err.message}`);
    throw err;
  }
}

async function verify(transactionId) {
  if (!isConfigured()) return mockGateway.verify(transactionId);
  try {
    const token = await getToken();
    const { data } = await axios.post(
      `${cfg.baseUrl}/tokenized/checkout/execute`,
      { paymentID: transactionId },
      { headers: { Authorization: token, 'X-APP-Key': cfg.appKey } }
    );
    const success = data.transactionStatus === 'Completed';
    return {
      provider: 'bkash',
      transactionId,
      status: success ? 'PAID' : 'FAILED',
      verified: success,
      raw: data,
    };
  } catch (err) {
    logger.error(`bKash verify failed: ${err.message}`);
    throw err;
  }
}

async function refund({ transactionId, amount }) {
  if (!isConfigured()) return mockGateway.refund({ transactionId, amount });
  try {
    const token = await getToken();
    const { data } = await axios.post(
      `${cfg.baseUrl}/tokenized/checkout/payment/refund`,
      { paymentID: transactionId, amount: String(amount), trxID: transactionId, sku: 'refund', reason: 'Order refund' },
      { headers: { Authorization: token, 'X-APP-Key': cfg.appKey } }
    );
    return {
      provider: 'bkash',
      transactionId,
      refundTransactionId: data.refundTrxID,
      amount,
      status: data.transactionStatus === 'Completed' ? 'REFUNDED' : 'FAILED',
      raw: data,
    };
  } catch (err) {
    logger.error(`bKash refund failed: ${err.message}`);
    throw err;
  }
}

module.exports = { name: 'bkash', isConfigured, initiate, verify, refund };
