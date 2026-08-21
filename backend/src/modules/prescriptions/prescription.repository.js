'use strict';

const Prescription = require('./prescription.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Prescription);

module.exports = {
  Model: Prescription,
  ...base,

  async findRawById(id) {
    return Prescription.findById(id).exec();
  },

  async listForCustomer(customerId, { status, page, limit } = {}) {
    const filter = { customer: customerId };
    if (status) filter.status = status;
    return base.list({ filter, page, limit });
  },

  async listForReview({ status, customer, page, limit } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    return base.list({
      filter,
      page,
      limit,
      sort: { createdAt: 1 },
      populate: { path: 'customer', select: 'name email phone' },
    });
  },
};
