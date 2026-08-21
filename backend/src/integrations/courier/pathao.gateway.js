'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const mockGateway = require('./mock.gateway');

const cfg = env.courier;

function isConfigured() {
  return cfg.provider === 'pathao' && Boolean(cfg.apiKey && cfg.apiSecret && cfg.baseUrl);
}

async function createShipment({ orderNumber, address, items, codAmount }) {
  if (!isConfigured()) {
    logger.warn('Pathao not configured, falling back to mock courier');
    return mockGateway.createShipment({ orderNumber, address, items, codAmount });
  }
  try {
    const { data } = await axios.post(
      `${cfg.baseUrl}/aladdin/api/v1/orders`,
      {
        merchant_order_id: orderNumber,
        recipient_name: address.name,
        recipient_phone: address.phone,
        recipient_address: address.line1,
        delivery_type: 48,
        item_type: 2,
        special_instruction: address.notes || '',
        item_quantity: items?.length || 1,
        item_weight: 0.5,
        amount_to_collect: codAmount || 0,
      },
      { headers: { Authorization: `Bearer ${cfg.apiKey}` } }
    );
    return {
      provider: 'pathao',
      trackingId: data.consignment_id,
      status: 'PICKUP_PENDING',
      orderNumber,
      raw: data,
    };
  } catch (err) {
    logger.error(`Pathao createShipment failed: ${err.message}`);
    throw err;
  }
}

async function trackShipment(trackingId) {
  if (!isConfigured()) return mockGateway.trackShipment(trackingId);
  try {
    const { data } = await axios.get(`${cfg.baseUrl}/aladdin/api/v1/orders/${trackingId}`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    return { provider: 'pathao', trackingId, status: data.order_status, raw: data };
  } catch (err) {
    logger.error(`Pathao trackShipment failed: ${err.message}`);
    throw err;
  }
}

async function cancelShipment(trackingId) {
  if (!isConfigured()) return mockGateway.cancelShipment(trackingId);
  try {
    await axios.put(
      `${cfg.baseUrl}/aladdin/api/v1/orders/${trackingId}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${cfg.apiKey}` } }
    );
    return { provider: 'pathao', trackingId, status: 'CANCELLED' };
  } catch (err) {
    logger.error(`Pathao cancelShipment failed: ${err.message}`);
    throw err;
  }
}

module.exports = { name: 'pathao', isConfigured, createShipment, trackShipment, cancelShipment };
