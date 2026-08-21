'use strict';

const Order = require('./order.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Order);

module.exports = {
  Model: Order,
  ...base,

  async findByOrderNumber(orderNumber) {
    return Order.findOne({ orderNumber }).exec();
  },

  async listForCustomer(customerId, { status, page, limit } = {}) {
    const filter = { customer: customerId };
    if (status) filter.status = status;
    return base.list({ filter, page, limit });
  },

  async listAll({ status, customer, page, limit } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    return base.list({
      filter,
      page,
      limit,
      populate: { path: 'customer', select: 'name email phone' },
    });
  },
};
