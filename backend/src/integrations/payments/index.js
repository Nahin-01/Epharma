'use strict';

const mock = require('./mock.gateway');
const sslcommerz = require('./sslcommerz.gateway');
const bkash = require('./bkash.gateway');
const nagad = require('./nagad.gateway');
const rocket = require('./rocket.gateway');

const GATEWAYS = {
  MOCK: mock,
  SSLCOMMERZ: sslcommerz,
  CARD: sslcommerz,
  BKASH: bkash,
  NAGAD: nagad,
  ROCKET: rocket,
};

/**
 * Resolves the adapter for a payment method. COD is intentionally excluded
 * here - it is handled entirely inside the payments service since it never
 * calls an external gateway.
 */
function getGateway(method) {
  const gateway = GATEWAYS[String(method || '').toUpperCase()];
  if (!gateway) {
    throw new Error(`Unsupported or unknown payment method: ${method}`);
  }
  return gateway;
}

module.exports = { getGateway, GATEWAYS };
