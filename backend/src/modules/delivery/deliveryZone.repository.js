'use strict';

const DeliveryZone = require('./deliveryZone.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(DeliveryZone);

module.exports = {
  ...base,
  async findForAddress(district, area) {
    return (
      (await DeliveryZone.findOne({ district, area, isActive: true })) ||
      (await DeliveryZone.findOne({ district, area: { $in: [null, ''] }, isActive: true }))
    );
  },
};
