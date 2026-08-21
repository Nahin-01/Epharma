'use strict';

const Warehouse = require('./warehouse.model');
const { createRepository } = require('../../utils/crud.factory');

module.exports = createRepository(Warehouse);
