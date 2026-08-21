'use strict';

const warehouseService = require('./warehouse.service');
const { createController } = require('../../utils/crud.factory');

module.exports = createController(warehouseService, 'Warehouse');
