'use strict';

const Customer = require('./customer.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Customer);

module.exports = {
  ...base,

  async findByUserId(userId, opts = {}) {
    let query = Customer.findOne({ user: userId });
    if (opts.populate) query = query.populate(opts.populate);
    return query.exec();
  },
};
