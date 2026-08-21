'use strict';

const Supplier = require('./supplier.model');
const { createRepository } = require('../../utils/crud.factory');

module.exports = createRepository(Supplier);
