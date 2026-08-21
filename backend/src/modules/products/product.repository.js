'use strict';

const Product = require('./product.model');
const { createRepository } = require('../../utils/crud.factory');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { escapeRegex } = require('../../utils/sanitize');

const base = createRepository(Product);

const SORT_MAP = {
  price_asc: { sellingPrice: 1 },
  price_desc: { sellingPrice: -1 },
  newest: { createdAt: -1 },
  best_selling: { soldCount: -1 },
  relevance: { isFeatured: -1, isBestSeller: -1, createdAt: -1 },
};

function buildFilter(query = {}) {
  const filter = {};
  if (query.status) filter.status = query.status;
  else filter.status = { $ne: 'DISCONTINUED' };

  if (query.category) filter.category = query.category;
  if (query.brand) filter.brand = query.brand;
  if (query.generic) filter.generic = query.generic;
  if (query.dosageForm) filter.dosageForm = query.dosageForm;
  if (query.prescriptionRequired !== undefined) filter.prescriptionRequired = query.prescriptionRequired;
  if (query.isFeatured !== undefined) filter.isFeatured = query.isFeatured;
  if (query.isBestSeller !== undefined) filter.isBestSeller = query.isBestSeller;
  if (query.inStock) filter.stockQuantity = { $gt: 0 };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.sellingPrice = {};
    if (query.minPrice !== undefined) filter.sellingPrice.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.sellingPrice.$lte = query.maxPrice;
  }

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: rx }, { bnName: rx }, { enName: rx }, { genericName: rx }, { tags: rx }];
  }

  return filter;
}

module.exports = {
  ...base,

  async findBySlug(slug) {
    return Product.findOne({ slug }).populate('category brand generic').exec();
  },

  async findBySku(sku) {
    return Product.findOne({ sku: String(sku).toUpperCase() }).exec();
  },

  async search(query = {}) {
    const filter = buildFilter(query);
    const { page, limit, skip } = getPagination(query);
    const sort = SORT_MAP[query.sort] || SORT_MAP.relevance;

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit).populate('category brand generic'),
      Product.countDocuments(filter),
    ]);

    return { items, meta: buildMeta({ page, limit, total }) };
  },

  async findRelated(product, limit = 8) {
    return Product.find({
      _id: { $ne: product._id },
      category: product.category,
      status: 'ACTIVE',
    })
      .limit(limit)
      .exec();
  },

  async incrementStock(productId, delta, session) {
    return Product.findByIdAndUpdate(
      productId,
      { $inc: { stockQuantity: delta } },
      { new: true, session }
    );
  },

  async incrementSoldCount(productId, qty, session) {
    return Product.findByIdAndUpdate(productId, { $inc: { soldCount: qty } }, { session });
  },
};
