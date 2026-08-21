'use strict';

const categoryRepository = require('./category.repository');
const { createService } = require('../../utils/crud.factory');
const ApiError = require('../../utils/apiError');

const base = createService(categoryRepository, 'Category');

async function create(data) {
  const existing = await categoryRepository.findBySlug(data.slug);
  if (existing) throw ApiError.conflict('A category with this slug already exists');
  return categoryRepository.create(data);
}

async function getTree(opts) {
  return categoryRepository.listTree(opts);
}

module.exports = { ...base, create, getTree };
