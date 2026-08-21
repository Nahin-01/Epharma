'use strict';

const axios = require('axios');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const mockGateway = require('./mock.gateway');

const cfg = env.courier;

function isConfigured() {
  return cfg.provider === 'redx' && Boolean(cfg.apiKey && cfg.baseUrl);
}

function headers() {
  return { 'API-ACCESS-TOKEN': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' };
}

async function createShipment({ orderNumber, address, items, codAmount }) {
  if (!isConfigured()) {
    logger.warn('RedX not configured, falling back to mock courier');
    return mockGateway.createShipment({ orderNumber, address, items, codAmount });
  }
  try {
    const { data } = await axios.post(
      `${cfg.baseUrl}/parcel`,
      {
        customer_name: address.name,
        customer_phone: address.phone,
        delivery_area: address.area,
        delivery_area_id: address.areaId,
        customer_address: address.line1,
        merchant_invoice_id: orderNumber,
        cash_collection_amount: codAmount || 0,
        parcel_weight: 500,
      },
      { headers: headers() }
    );
    return {
      provider: 'redx',
      trackingId: data.tracking_id,
      status: 'PICKUP_PENDING',
      orderNumber,
      raw: data,
    };
  } catch (err) {
    logger.error(`RedX createShipment failed: ${err.message}`);
    throw err;
  }
}

async function trackShipment(trackingId) {
  if (!isConfigured()) return mockGateway.trackShipment(trackingId);
  try {
    const { data } = await axios.get(`${cfg.baseUrl}/parcel/track/${trackingId}`, { headers: headers() });
    return { provider: 'redx', trackingId, status: data.tracking?.status, raw: data };
  } catch (err) {
    logger.error(`RedX trackShipment failed: ${err.message}`);
    throw err;
  }
}

async function cancelShipment(trackingId) {
  if (!isConfigured()) return mockGateway.cancelShipment(trackingId);
  try {
    await axios.put(`${cfg.baseUrl}/parcel/cancel/${trackingId}`, {}, { headers: headers() });
    return { provider: 'redx', trackingId, status: 'CANCELLED' };
  } catch (err) {
    logger.error(`RedX cancelShipment failed: ${err.message}`);
    throw err;
  }
}

module.exports = { name: 'redx', isConfigured, createShipment, trackShipment, cancelShipment };
