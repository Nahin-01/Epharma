'use strict';

const Doctor = require('./doctor.model');
const { createRepository } = require('../../utils/crud.factory');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { escapeRegex } = require('../../utils/sanitize');

const base = createRepository(Doctor);

module.exports = {
  Model: Doctor,
  ...base,

  async search({ search, specialty, district, upazilla, page, limit } = {}) {
    const filter = { isActive: true };
    if (specialty) filter.specialty = new RegExp(escapeRegex(specialty), 'i');
    if (district) filter['chambers.district'] = new RegExp(escapeRegex(district), 'i');
    if (upazilla) filter['chambers.upazilla'] = new RegExp(escapeRegex(upazilla), 'i');
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: rx }, { bnName: rx }, { specialty: rx }];
    }

    const { page: p, limit: l, skip } = getPagination({ page, limit });
    const [items, total] = await Promise.all([
      Doctor.find(filter).sort({ isVerified: -1, name: 1 }).skip(skip).limit(l),
      Doctor.countDocuments(filter),
    ]);
    return { items, meta: buildMeta({ page: p, limit: l, total }) };
  },

  async listSpecialties() {
    return Doctor.distinct('specialty', { isActive: true });
  },
};
