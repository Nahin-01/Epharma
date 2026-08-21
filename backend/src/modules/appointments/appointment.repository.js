'use strict';

const Appointment = require('./appointment.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Appointment);

module.exports = {
  Model: Appointment,
  ...base,

  async listForCustomer(customerId, { page, limit } = {}) {
    return base.list({
      filter: { customer: customerId },
      page,
      limit,
      populate: { path: 'doctor', select: 'name specialty chambers' },
    });
  },

  async listForDoctor(doctorId, { page, limit, status } = {}) {
    const filter = { doctor: doctorId };
    if (status) filter.status = status;
    return base.list({
      filter,
      page,
      limit,
      sort: { date: 1 },
      populate: { path: 'customer', select: 'name phone' },
    });
  },
};
