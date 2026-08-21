'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false, timestamps: true }
);

const cartSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [cartItemSchema],
    couponCode: { type: String, uppercase: true, default: null },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
