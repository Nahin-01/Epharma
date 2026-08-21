'use strict';

const Coupon = require('./coupon.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Coupon);

module.exports = {
  ...base,
  async findByCode(code) {
    return Coupon.findOne({ code: String(code).toUpperCase() }).exec();
  },
};
