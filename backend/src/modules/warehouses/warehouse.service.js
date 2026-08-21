'use strict';

const warehouseRepository = require('./warehouse.repository');
const { createService } = require('../../utils/crud.factory');

module.exports = createService(warehouseRepository, 'Warehouse');
