'use strict';

const ProductRequest = require('./productRequest.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(ProductRequest);

module.exports = {
  Model: ProductRequest,
  ...base,

  async listForCustomer(customerId, { page, limit } = {}) {
    return base.list({ filter: { customer: customerId }, page, limit });
  },

  async listAll({ status, page, limit } = {}) {
    const filter = {};
    if (status) filter.status = status;
    return base.list({ filter, page, limit, populate: { path: 'customer', select: 'name email phone' } });
  },
};
