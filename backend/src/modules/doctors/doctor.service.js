'use strict';

const doctorRepository = require('./doctor.repository');
const { createService } = require('../../utils/crud.factory');

const base = createService(doctorRepository, 'Doctor');

async function search(query) {
  return doctorRepository.search(query);
}

async function listSpecialties() {
  return doctorRepository.listSpecialties();
}

module.exports = { ...base, search, listSpecialties };
