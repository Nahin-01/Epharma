'use strict';

const User = require('./user.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(User);

module.exports = {
  ...base,

  async findByEmail(email, { withPassword = false } = {}) {
    let query = User.findOne({ email: String(email).toLowerCase() });
    if (withPassword) query = query.select('+passwordHash +otp');
    return query.exec();
  },

  async findByPhone(phone, { withPassword = false } = {}) {
    let query = User.findOne({ phone });
    if (withPassword) query = query.select('+passwordHash +otp');
    return query.exec();
  },

  async findByIdWithSecrets(id) {
    return User.findById(id).select('+passwordHash +otp').exec();
  },

  async findByEmailOrPhone(identifier, { withPassword = false } = {}) {
    const isEmail = /@/.test(identifier);
    return isEmail
      ? this.findByEmail(identifier, { withPassword })
      : this.findByPhone(identifier, { withPassword });
  },
};
