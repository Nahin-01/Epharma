'use strict';

const Category = require('./category.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(Category);

module.exports = {
  ...base,

  async findBySlug(slug) {
    return Category.findOne({ slug }).exec();
  },

  async listTree({ activeOnly = true } = {}) {
    const filter = activeOnly ? { isActive: true } : {};
    const all = await Category.find(filter).sort({ order: 1, name: 1 }).lean();
    const byId = new Map(all.map((c) => [String(c._id), { ...c, children: [] }]));
    const roots = [];
    for (const cat of byId.values()) {
      if (cat.parent && byId.has(String(cat.parent))) {
        byId.get(String(cat.parent)).children.push(cat);
      } else {
        roots.push(cat);
      }
    }
    return roots;
  },
};
