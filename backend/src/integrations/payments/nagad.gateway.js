'use strict';

const axios = require('axios');
const crypto = require('crypto');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const mockGateway = require('./mock.gateway');

const cfg = env.payments.nagad;

function isConfigured() {
  return Boolean(cfg.merchantId && cfg.merchantNumber && cfg.publicKey && cfg.privateKey && cfg.baseUrl);
}

function sign(data) {
  const signer = crypto.createSign('SHA256');
  signer.update(data);
  signer.end();
  return signer.sign(cfg.privateKey, 'base64');
}

async function initiate({ amount, orderNumber, callbackUrl }) {
  if (!isConfigured()) {
    logger.warn('Nagad not configured, falling back to mock gateway');
    return mockGateway.initiate({ amount, orderNumber });
  }
  try {
    const sensitiveData = { merchantId: cfg.merchantId, orderId: orderNumber, amount, currencyCode: '050' };
    const payload = {
      accountNumber: cfg.merchantNumber,
      dateTime: new Date().toISOString(),
      sensitiveData: Buffer.from(JSON.stringify(sensitiveData)).toString('base64'),
      signature: sign(JSON.stringify(sensitiveData)),
    };
    const { data } = await axios.post(
      `${cfg.baseUrl}/api/dfs/check-out/initialize/${cfg.merchantId}/${orderNumber}`,
      payload
    );
    return {
      provider: 'nagad',
      transactionId: data.paymentReferenceId || orderNumber,
      status: 'PROCESSING',
      amount,
      orderNumber,
      redirectUrl: data.callBackUrl || callbackUrl,
      raw: data,
    };
  } catch (err) {
    logger.error(`Nagad initiate failed: ${err.message}`);
    throw err;
  }
}

async function verify(transactionId) {
  if (!isConfigured()) return mockGateway.verify(transactionId);
  try {
    const { data } = await axios.get(`${cfg.baseUrl}/api/dfs/verify/payment/${transactionId}`);
    const success = data.status === 'Success';
    return {
      provider: 'nagad',
      transactionId,
      status: success ? 'PAID' : 'FAILED',
      verified: success,
      raw: data,
    };
  } catch (err) {
    logger.error(`Nagad verify failed: ${err.message}`);
    throw err;
  }
}

async function refund({ transactionId, amount }) {
  // Nagad does not expose a public programmatic refund API; refunds are
  // typically reconciled manually. Fall back to the mock so the order flow
  // still completes and gets flagged for manual review.
  logger.warn('Nagad refund requested - no public API, recording as manual/mock refund');
  return mockGateway.refund({ transactionId, amount });
}

module.exports = { name: 'nagad', isConfigured, initiate, verify, refund };
