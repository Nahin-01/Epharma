'use strict';

const inventoryRepository = require('./inventory.repository');
const productRepository = require('../products/product.repository');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');
const { recordAudit } = require('../../utils/audit');

async function createBatch(data, actor) {
  const batch = await inventoryRepository.create(data);
  await productRepository.incrementStock(data.product, data.quantity);
  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'INVENTORY_BATCH_CREATED',
    entityType: 'InventoryBatch',
    entityId: batch._id,
    changes: { product: data.product, quantity: data.quantity },
  });
  return batch;
}

async function updateBatch(id, data, actor) {
  const existing = await inventoryRepository.findById(id);
  if (!existing) throw ApiError.notFound('Inventory batch not found');

  const batch = await inventoryRepository.updateById(id, data);

  if (data.quantity !== undefined && data.quantity !== existing.quantity) {
    const delta = data.quantity - existing.quantity;
    await productRepository.incrementStock(existing.product, delta);
  }

  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'INVENTORY_BATCH_UPDATED',
    entityType: 'InventoryBatch',
    entityId: id,
    changes: data,
  });
  return batch;
}

async function listBatches(query) {
  return inventoryRepository.listBatches(query);
}

async function getBatchById(id) {
  const batch = await inventoryRepository.findById(id, {
    populate: [{ path: 'product', select: 'name sku' }, { path: 'warehouse', select: 'name code' }, { path: 'supplier', select: 'name' }],
  });
  if (!batch) throw ApiError.notFound('Inventory batch not found');
  return batch;
}

/**
 * Reserves `quantity` units of a product across its active batches using a
 * FEFO (first-expiry-first-out) strategy. Each batch reservation is a
 * single-document atomic update, so this is safe under concurrent checkouts
 * without requiring a MongoDB replica set / multi-document transaction.
 * Returns the list of {batch, quantity} allocations made, or throws and
 * rolls back any partial reservation if the full quantity can't be secured.
 */
async function reserveStock(productId, quantity) {
  const batches = await inventoryRepository.findActiveBatchesForProduct(productId);
  const allocations = [];
  let remaining = quantity;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const available = batch.quantity - batch.reservedQuantity;
    if (available <= 0) continue;
    const take = Math.min(available, remaining);

    const updated = await inventoryRepository.reserveOnBatch(batch._id, take);
    if (updated) {
      allocations.push({ batch: batch._id, product: productId, quantity: take });
      remaining -= take;
    }
  }

  if (remaining > 0) {
    await releaseAllocations(allocations);
    throw ApiError.badRequest('Insufficient stock available for one or more items');
  }

  return allocations;
}

async function releaseAllocations(allocations = []) {
  const results = [];
  for (const alloc of allocations) {
    results.push(await inventoryRepository.releaseOnBatch(alloc.batch, alloc.quantity));
  }
  return results;
}

async function commitAllocations(allocations = []) {
  const results = [];
  for (const alloc of allocations) {
    const batch = await inventoryRepository.commitOnBatch(alloc.batch, alloc.quantity);
    await productRepository.incrementStock(alloc.product, -alloc.quantity);
    await productRepository.incrementSoldCount(alloc.product, alloc.quantity);
    results.push(batch);
  }
  return results;
}

/** Reverses a commit (used on RETURNED orders) - puts the physical quantity back into the batch and product stock. */
async function restockAllocations(allocations = []) {
  const results = [];
  for (const alloc of allocations) {
    const batch = await inventoryRepository.restockOnBatch(alloc.batch, alloc.quantity);
    await productRepository.incrementStock(alloc.product, alloc.quantity);
    results.push(batch);
  }
  return results;
}

async function releaseReservationsForOrder(orderId) {
  const orderRepository = require('../orders/order.repository');
  const order = await orderRepository.findById(orderId);
  if (!order || !order.inventoryAllocations || order.inventoryAllocations.length === 0) {
    return { released: 0 };
  }
  await releaseAllocations(order.inventoryAllocations);
  return { released: order.inventoryAllocations.length };
}

async function scanLowStockAndExpiring() {
  const [lowStock, expiring] = await Promise.all([
    inventoryRepository.findLowStockProducts(),
    inventoryRepository.findExpiringBatches(30),
  ]);
  logger.info(`[inventory-scan] ${lowStock.length} low-stock product(s), ${expiring.length} batch(es) expiring within 30 days`);
  return { lowStockCount: lowStock.length, expiringCount: expiring.length, lowStock, expiring };
}

module.exports = {
  createBatch,
  updateBatch,
  listBatches,
  getBatchById,
  reserveStock,
  releaseAllocations,
  commitAllocations,
  restockAllocations,
  releaseReservationsForOrder,
  scanLowStockAndExpiring,
};
