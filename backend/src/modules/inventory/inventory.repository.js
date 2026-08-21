'use strict';

const InventoryBatch = require('./inventoryBatch.model');
const { createRepository } = require('../../utils/crud.factory');
const { getPagination, buildMeta } = require('../../utils/pagination');

const base = createRepository(InventoryBatch);

module.exports = {
  Model: InventoryBatch,
  ...base,

  async listBatches({ product, warehouse, status, expiringWithinDays, page, limit } = {}) {
    const filter = {};
    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;
    if (status) filter.status = status;
    if (expiringWithinDays) {
      filter.expiryDate = { $lte: new Date(Date.now() + expiringWithinDays * 24 * 60 * 60 * 1000) };
      filter.status = filter.status || 'ACTIVE';
    }
    const { page: p, limit: l, skip } = getPagination({ page, limit });
    const [items, total] = await Promise.all([
      InventoryBatch.find(filter)
        .sort({ expiryDate: 1 })
        .skip(skip)
        .limit(l)
        .populate('product', 'name sku')
        .populate('warehouse', 'name code')
        .populate('supplier', 'name'),
      InventoryBatch.countDocuments(filter),
    ]);
    return { items, meta: buildMeta({ page: p, limit: l, total }) };
  },

  async findActiveBatchesForProduct(productId) {
    return InventoryBatch.find({
      product: productId,
      status: 'ACTIVE',
      expiryDate: { $gt: new Date() },
    }).sort({ expiryDate: 1 });
  },

  async reserveOnBatch(batchId, quantity) {
    return InventoryBatch.findOneAndUpdate(
      {
        _id: batchId,
        status: 'ACTIVE',
        $expr: { $gte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, quantity] },
      },
      { $inc: { reservedQuantity: quantity } },
      { new: true }
    );
  },

  async releaseOnBatch(batchId, quantity) {
    return InventoryBatch.findByIdAndUpdate(
      batchId,
      { $inc: { reservedQuantity: -quantity } },
      { new: true }
    );
  },

  async commitOnBatch(batchId, quantity) {
    const batch = await InventoryBatch.findByIdAndUpdate(
      batchId,
      { $inc: { quantity: -quantity, reservedQuantity: -quantity } },
      { new: true }
    );
    if (batch && batch.quantity <= 0 && batch.status === 'ACTIVE') {
      batch.status = 'DEPLETED';
      await batch.save();
    }
    return batch;
  },

  async restockOnBatch(batchId, quantity) {
    const batch = await InventoryBatch.findByIdAndUpdate(
      batchId,
      { $inc: { quantity } },
      { new: true }
    );
    if (batch && batch.status === 'DEPLETED' && batch.quantity > 0) {
      batch.status = 'ACTIVE';
      await batch.save();
    }
    return batch;
  },

  async findLowStockProducts() {
    const Product = require('../products/product.model');
    return Product.find({
      status: 'ACTIVE',
      $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
    }).select('name sku stockQuantity lowStockThreshold');
  },

  async findExpiringBatches(withinDays = 30) {
    return InventoryBatch.find({
      status: 'ACTIVE',
      expiryDate: { $lte: new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000), $gt: new Date() },
    })
      .populate('product', 'name sku')
      .populate('warehouse', 'name code');
  },
};
