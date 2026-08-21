'use strict';

const ApiError = require('./apiError');
const { getPagination, buildMeta } = require('./pagination');

/**
 * Generic repository factory. Modules with straightforward CRUD needs
 * (categories, brands, generics, warehouses, suppliers, coupons, ...) build
 * their repository on top of this instead of hand-rolling the same
 * find/create/update/delete boilerplate. Modules with richer domain logic
 * (products, orders, prescriptions, ...) implement bespoke repositories
 * instead of using this factory.
 */
function createRepository(Model) {
  return {
    Model,

    async create(data) {
      const doc = await Model.create(data);
      return doc;
    },

    async findById(id, { populate } = {}) {
      let query = Model.findById(id);
      if (populate) query = query.populate(populate);
      return query.exec();
    },

    async findOne(filter, { populate } = {}) {
      let query = Model.findOne(filter);
      if (populate) query = query.populate(populate);
      return query.exec();
    },

    async list({ filter = {}, sort = { createdAt: -1 }, page, limit, populate } = {}) {
      const { page: p, limit: l, skip } = getPagination({ page, limit });
      let query = Model.find(filter).sort(sort).skip(skip).limit(l);
      if (populate) query = query.populate(populate);
      const [items, total] = await Promise.all([query.exec(), Model.countDocuments(filter)]);
      return { items, meta: buildMeta({ page: p, limit: l, total }) };
    },

    async updateById(id, data) {
      const doc = await Model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
      return doc;
    },

    async deleteById(id) {
      const doc = await Model.findByIdAndDelete(id);
      return doc;
    },

    async count(filter = {}) {
      return Model.countDocuments(filter);
    },
  };
}

/**
 * Generic service factory wrapping a repository with existence checks and a
 * uniform not-found error. `entityName` is used in error messages.
 */
function createService(repository, entityName = 'Resource') {
  return {
    repository,

    async create(data) {
      return repository.create(data);
    },

    async getById(id, opts) {
      const doc = await repository.findById(id, opts);
      if (!doc) throw ApiError.notFound(`${entityName} not found`);
      return doc;
    },

    async list(opts) {
      return repository.list(opts);
    },

    async update(id, data) {
      const doc = await repository.updateById(id, data);
      if (!doc) throw ApiError.notFound(`${entityName} not found`);
      return doc;
    },

    async remove(id) {
      const doc = await repository.deleteById(id);
      if (!doc) throw ApiError.notFound(`${entityName} not found`);
      return doc;
    },
  };
}

/**
 * Generic controller factory producing standard Express handlers bound to a
 * service. Individual modules can still add extra handlers alongside these.
 */
function createController(service, entityName = 'Resource') {
  const asyncHandler = require('./asyncHandler');
  const ApiResponse = require('./apiResponse');

  return {
    create: asyncHandler(async (req, res) => {
      const doc = await service.create(req.body);
      return ApiResponse.created(res, doc, `${entityName} created successfully`);
    }),

    getById: asyncHandler(async (req, res) => {
      const doc = await service.getById(req.params.id);
      return ApiResponse.ok(res, doc);
    }),

    list: asyncHandler(async (req, res) => {
      const { items, meta } = await service.list({
        page: req.query.page,
        limit: req.query.limit,
      });
      return ApiResponse.ok(res, items, 'Success', meta);
    }),

    update: asyncHandler(async (req, res) => {
      const doc = await service.update(req.params.id, req.body);
      return ApiResponse.ok(res, doc, `${entityName} updated successfully`);
    }),

    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      return ApiResponse.ok(res, null, `${entityName} deleted successfully`);
    }),
  };
}

module.exports = { createRepository, createService, createController };
