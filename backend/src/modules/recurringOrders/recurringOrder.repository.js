'use strict';

const RecurringOrder = require('./recurringOrder.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(RecurringOrder);

module.exports = {
  Model: RecurringOrder,
  ...base,

  async listForCustomer(customerId) {
    return RecurringOrder.find({ customer: customerId }).sort({ createdAt: -1 });
  },

  async findDue(now = new Date()) {
    return RecurringOrder.find({ status: 'ACTIVE', nextRefillDate: { $lte: now } });
  },
};
