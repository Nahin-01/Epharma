'use strict';

const Delivery = require('./delivery.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Delivery);

module.exports = {
  Model: Delivery,
  ...base,

  async findByOrder(orderId) {
    return Delivery.findOne({ order: orderId }).exec();
  },
};
