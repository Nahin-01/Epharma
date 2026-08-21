'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const PRODUCT_TYPES = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'SUSPENSION',
  'CREAM',
  'OINTMENT',
  'DROPS',
  'INJECTION',
  'INHALER',
  'DEVICE',
  'OTHER',
];

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    bnName: { type: String, trim: true },
    enName: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true },

    genericName: { type: String, trim: true, index: true },
    generic: { type: Schema.Types.ObjectId, ref: 'Generic' },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    dosageForm: { type: String, enum: PRODUCT_TYPES, default: 'OTHER', index: true },
    strength: { type: String },
    manufacturer: { type: String },

    prescriptionRequired: { type: Boolean, default: false, index: true },
    description: { type: String },
    images: [{ type: String }],

    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },

    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10 },

    tags: [{ type: String, index: true }],
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false, index: true },
    isPromoted: { type: Boolean, default: false },

    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'], default: 'ACTIVE', index: true },

    soldCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', bnName: 'text', enName: 'text', genericName: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ mrp: 1, sellingPrice: 1 });

productSchema.virtual('discountAmount').get(function discountAmount() {
  return Math.max(0, this.mrp - this.sellingPrice);
});

productSchema.virtual('inStock').get(function inStock() {
  return this.stockQuantity > 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.statics.PRODUCT_TYPES = PRODUCT_TYPES;

module.exports = mongoose.model('Product', productSchema);
