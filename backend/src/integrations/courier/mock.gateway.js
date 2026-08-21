'use strict';

const { generateCode } = require('../../utils/crypto');

/**
 * In-memory mock courier used when no real courier credentials are set.
 * Implements the same interface every real courier adapter implements:
 * createShipment / trackShipment / cancelShipment.
 */
async function createShipment({ orderNumber, address, items, codAmount }) {
  const trackingId = generateCode('MOCKTRK');
  return {
    provider: 'mock',
    trackingId,
    status: 'PICKUP_PENDING',
    orderNumber,
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    raw: { address, itemCount: items?.length || 0, codAmount },
  };
}

async function trackShipment(trackingId) {
  return {
    provider: 'mock',
    trackingId,
    status: 'IN_TRANSIT',
    history: [
      { status: 'PICKUP_PENDING', at: new Date(Date.now() - 3600 * 1000) },
      { status: 'PICKED_UP', at: new Date(Date.now() - 1800 * 1000) },
      { status: 'IN_TRANSIT', at: new Date() },
    ],
  };
}

async function cancelShipment(trackingId) {
  return { provider: 'mock', trackingId, status: 'CANCELLED' };
}

module.exports = { name: 'mock', createShipment, trackShipment, cancelShipment };
