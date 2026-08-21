'use strict';

const Brand = require('./brand.model');
const { createRepository } = require('../../utils/crud.factory');

module.exports = createRepository(Brand);
