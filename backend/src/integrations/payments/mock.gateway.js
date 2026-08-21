'use strict';

const { generateCode } = require('../../utils/crypto');

/**
 * Sandbox/mock payment gateway. Used automatically whenever a real
 * gateway's credentials are not configured, so checkout keeps working end
 * to end in development and automated tests without any third-party
 * account. Every real gateway module implements the same interface
 * (initiate/verify/refund) so callers never need to know which one is
 * active.
 */
async function initiate({ amount, currency = 'BDT', orderNumber, customer }) {
  const transactionId = generateCode('MOCKTXN');
  return {
    provider: 'mock',
    transactionId,
    status: 'PROCESSING',
    amount,
    currency,
    orderNumber,
    // In a real gateway this would be a redirect URL to the hosted checkout
    // page. The mock resolves immediately via /payments/:id/mock-complete.
    redirectUrl: `/api/v1/payments/mock/${transactionId}/complete`,
    raw: { customer: customer ? customer.id : null },
  };
}

async function verify(transactionId) {
  return {
    provider: 'mock',
    transactionId,
    status: 'PAID',
    verified: true,
  };
}

async function refund({ transactionId, amount }) {
  return {
    provider: 'mock',
    transactionId,
    refundTransactionId: generateCode('MOCKRFND'),
    amount,
    status: 'REFUNDED',
  };
}

module.exports = { name: 'mock', initiate, verify, refund };
