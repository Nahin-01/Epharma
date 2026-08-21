'use strict';

const env = require('../../config/env');
const mock = require('./mock.gateway');
const pathao = require('./pathao.gateway');
const steadfast = require('./steadfast.gateway');
const redx = require('./redx.gateway');

const PROVIDERS = { mock, pathao, steadfast, redx };

/** Returns the courier adapter configured via COURIER_PROVIDER (defaults to mock). */
function getCourier() {
  return PROVIDERS[env.courier.provider] || mock;
}

module.exports = { getCourier, PROVIDERS };
