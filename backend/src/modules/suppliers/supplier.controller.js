'use strict';

const supplierService = require('./supplier.service');
const { createController } = require('../../utils/crud.factory');

module.exports = createController(supplierService, 'Supplier');
