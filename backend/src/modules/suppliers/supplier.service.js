'use strict';

const supplierRepository = require('./supplier.repository');
const { createService } = require('../../utils/crud.factory');

module.exports = createService(supplierRepository, 'Supplier');
