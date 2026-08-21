'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const inventoryBatchSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },

    batchNumber: { type: String, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },

    quantity: { type: Number, required: true, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },

    manufacturingDate: { type: Date },
    expiryDate: { type: Date, required: true, index: true },

    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'DEPLETED', 'RECALLED'], default: 'ACTIVE', index: true },
  },
  { timestamps: true }
);

inventoryBatchSchema.index({ product: 1, status: 1, expiryDate: 1 });
inventoryBatchSchema.index({ product: 1, warehouse: 1, batchNumber: 1 }, { unique: true });

inventoryBatchSchema.virtual('availableQuantity').get(function availableQuantity() {
  return Math.max(0, this.quantity - this.reservedQuantity);
});

inventoryBatchSchema.set('toJSON', { virtuals: true });
inventoryBatchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('InventoryBatch', inventoryBatchSchema);
