'use strict';

const genericRepository = require('./generic.repository');
const { createService } = require('../../utils/crud.factory');

const base = createService(genericRepository, 'Generic');

async function search(term) {
  if (!term) return [];
  return genericRepository.search(term);
}

module.exports = { ...base, search };
