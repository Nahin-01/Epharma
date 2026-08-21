'use strict';

const deliveryZoneRepository = require('./deliveryZone.repository');
const { createService } = require('../../utils/crud.factory');

module.exports = createService(deliveryZoneRepository, 'Delivery zone');
