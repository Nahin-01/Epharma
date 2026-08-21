'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const mockGateway = require('./mock.gateway');

const cfg = env.payments.sslcommerz;
const BASE_URL = cfg.isLive
  ? 'https://securepay.sslcommerz.com'
  : 'https://sandbox.sslcommerz.com';

function isConfigured() {
  return Boolean(cfg.storeId && cfg.storePassword);
}

async function initiate({ amount, currency = 'BDT', orderNumber, customer, successUrl, failUrl, cancelUrl }) {
  if (!isConfigured()) {
    logger.warn('SSLCommerz not configured, falling back to mock gateway');
    return mockGateway.initiate({ amount, currency, orderNumber, customer });
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/gwprocess/v4/api.php`, {
      store_id: cfg.storeId,
      store_passwd: cfg.storePassword,
      total_amount: amount,
      currency,
      tran_id: orderNumber,
      success_url: successUrl,
      fail_url: failUrl,
      cancel_url: cancelUrl,
      cus_name: customer?.name,
      cus_email: customer?.email,
      cus_phone: customer?.phone,
      shipping_method: 'Courier',
      product_name: 'ePharmacy order',
      product_category: 'Pharmacy',
      product_profile: 'general',
    });

    return {
      provider: 'sslcommerz',
      transactionId: orderNumber,
      status: 'PROCESSING',
      amount,
      currency,
      orderNumber,
      redirectUrl: data.GatewayPageURL,
      raw: data,
    };
  } catch (err) {
    logger.error(`SSLCommerz initiate failed: ${err.message}`);
    throw err;
  }
}

async function verify(transactionId) {
  if (!isConfigured()) return mockGateway.verify(transactionId);
  try {
    const { data } = await axios.get(`${BASE_URL}/validator/api/validationserverAPI.php`, {
      params: {
        val_id: transactionId,
        store_id: cfg.storeId,
        store_passwd: cfg.storePassword,
        format: 'json',
      },
    });
    const success = data.status === 'VALID' || data.status === 'VALIDATED';
    return {
      provider: 'sslcommerz',
      transactionId,
      status: success ? 'PAID' : 'FAILED',
      verified: success,
      raw: data,
    };
  } catch (err) {
    logger.error(`SSLCommerz verify failed: ${err.message}`);
    throw err;
  }
}

async function refund({ transactionId, amount }) {
  if (!isConfigured()) return mockGateway.refund({ transactionId, amount });
  try {
    const { data } = await axios.post(`${BASE_URL}/validator/api/merchantTransIDvalidationAPI.php`, {
      bank_tran_id: transactionId,
      store_id: cfg.storeId,
      store_passwd: cfg.storePassword,
      refund_amount: amount,
      refund_remarks: 'Order refund',
      format: 'json',
    });
    return {
      provider: 'sslcommerz',
      transactionId,
      refundTransactionId: data.refund_ref_id,
      amount,
      status: data.status === 'success' ? 'REFUNDED' : 'FAILED',
      raw: data,
    };
  } catch (err) {
    logger.error(`SSLCommerz refund failed: ${err.message}`);
    throw err;
  }
}

module.exports = { name: 'sslcommerz', isConfigured, initiate, verify, refund };
