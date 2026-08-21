'use strict';

const Generic = require('./generic.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Generic);

module.exports = {
  ...base,
  async search(term, limit = 10) {
    return Generic.find({ $text: { $search: term }, isActive: true })
      .limit(limit)
      .exec();
  },
};
