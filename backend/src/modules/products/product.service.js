'use strict';

const productRepository = require('./product.repository');
const ApiError = require('../../utils/apiError');
const { generateCode } = require('../../utils/crypto');
const { recordAudit } = require('../../utils/audit');

async function create(data, actor) {
  const existingSlug = await productRepository.findBySlug(data.slug);
  if (existingSlug) throw ApiError.conflict('A product with this slug already exists');

  const payload = { ...data };
  if (!payload.sku) payload.sku = generateCode('SKU', 8);
  else {
    const existingSku = await productRepository.findBySku(payload.sku);
    if (existingSku) throw ApiError.conflict('A product with this SKU already exists');
  }

  const product = await productRepository.create(payload);
  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: product._id,
  });
  return product;
}

async function update(id, data, actor) {
  if (data.slug) {
    const existing = await productRepository.findBySlug(data.slug);
    if (existing && String(existing._id) !== String(id)) {
      throw ApiError.conflict('A product with this slug already exists');
    }
  }
  const product = await productRepository.updateById(id, data);
  if (!product) throw ApiError.notFound('Product not found');
  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'PRODUCT_UPDATED',
    entityType: 'Product',
    entityId: product._id,
    changes: data,
  });
  return product;
}

async function remove(id, actor) {
  const product = await productRepository.deleteById(id);
  if (!product) throw ApiError.notFound('Product not found');
  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'PRODUCT_DELETED',
    entityType: 'Product',
    entityId: id,
  });
  return product;
}

async function getById(id) {
  const product = await productRepository.findById(id, { populate: 'category brand generic' });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

async function getBySlug(slug) {
  const product = await productRepository.findBySlug(slug);
  if (!product) throw ApiError.notFound('Product not found');
  product.viewCount += 1;
  await product.save({ validateBeforeSave: false });
  return product;
}

async function list(query) {
  return productRepository.search(query);
}

async function getRelated(id, limit) {
  const product = await getById(id);
  return productRepository.findRelated(product, limit);
}

async function checkAvailability(productId, quantity) {
  const product = await productRepository.findById(productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== 'ACTIVE') throw ApiError.badRequest(`${product.name} is not currently available`);
  if (product.stockQuantity < quantity) {
    throw ApiError.badRequest(`Insufficient stock for ${product.name}. Only ${product.stockQuantity} left.`);
  }
  return product;
}

module.exports = {
  create,
  update,
  remove,
  getById,
  getBySlug,
  list,
  getRelated,
  checkAvailability,
  repository: productRepository,
};
