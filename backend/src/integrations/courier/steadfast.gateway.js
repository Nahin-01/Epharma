'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const mockGateway = require('./mock.gateway');

const cfg = env.courier;

function isConfigured() {
  return cfg.provider === 'steadfast' && Boolean(cfg.apiKey && cfg.apiSecret && cfg.baseUrl);
}

function headers() {
  return { 'Api-Key': cfg.apiKey, 'Secret-Key': cfg.apiSecret, 'Content-Type': 'application/json' };
}

async function createShipment({ orderNumber, address, items, codAmount }) {
  if (!isConfigured()) {
    logger.warn('Steadfast not configured, falling back to mock courier');
    return mockGateway.createShipment({ orderNumber, address, items, codAmount });
  }
  try {
    const { data } = await axios.post(
      `${cfg.baseUrl}/create_order`,
      {
        invoice: orderNumber,
        recipient_name: address.name,
        recipient_phone: address.phone,
        recipient_address: address.line1,
        cod_amount: codAmount || 0,
        note: `${items?.length || 0} item(s)`,
      },
      { headers: headers() }
    );
    return {
      provider: 'steadfast',
      trackingId: data.consignment?.tracking_code,
      status: 'PICKUP_PENDING',
      orderNumber,
      raw: data,
    };
  } catch (err) {
    logger.error(`Steadfast createShipment failed: ${err.message}`);
    throw err;
  }
}

async function trackShipment(trackingId) {
  if (!isConfigured()) return mockGateway.trackShipment(trackingId);
  try {
    const { data } = await axios.get(`${cfg.baseUrl}/status_by_trackingcode/${trackingId}`, {
      headers: headers(),
    });
    return { provider: 'steadfast', trackingId, status: data.delivery_status, raw: data };
  } catch (err) {
    logger.error(`Steadfast trackShipment failed: ${err.message}`);
    throw err;
  }
}

async function cancelShipment(trackingId) {
  logger.warn('Steadfast does not expose a public cancel API; marking cancelled locally');
  return { provider: 'steadfast', trackingId, status: 'CANCELLED' };
}

module.exports = { name: 'steadfast', isConfigured, createShipment, trackShipment, cancelShipment };
