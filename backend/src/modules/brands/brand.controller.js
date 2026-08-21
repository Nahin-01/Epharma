'use strict';

const brandService = require('./brand.service');
const { createController } = require('../../utils/crud.factory');

module.exports = createController(brandService, 'Brand');
