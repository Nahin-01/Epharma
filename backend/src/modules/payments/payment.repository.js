'use strict';

const Payment = require('./payment.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Payment);

module.exports = {
  Model: Payment,
  ...base,

  async findByTransactionId(transactionId) {
    return Payment.findOne({ transactionId }).exec();
  },

  async findByOrder(orderId) {
    return Payment.findOne({ order: orderId }).sort({ createdAt: -1 }).exec();
  },
};
