'use strict';

const Cart = require('./cart.model');

module.exports = {
  Model: Cart,

  async findByCustomer(customerId) {
    return Cart.findOne({ customer: customerId }).exec();
  },

  async findByCustomerPopulated(customerId) {
    return Cart.findOne({ customer: customerId }).populate({
      path: 'items.product',
      select: 'name bnName images sellingPrice mrp stockQuantity prescriptionRequired status',
    });
  },

  async createForCustomer(customerId) {
    return Cart.create({ customer: customerId, items: [] });
  },
};
