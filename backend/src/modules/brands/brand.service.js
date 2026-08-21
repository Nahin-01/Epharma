'use strict';

const brandRepository = require('./brand.repository');
const { createService } = require('../../utils/crud.factory');

module.exports = createService(brandRepository, 'Brand');
