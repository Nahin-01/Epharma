'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ['PERCENTAGE', 'FIXED'], required: true },
    value: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscountAmount: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usageLimitPerCustomer: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
