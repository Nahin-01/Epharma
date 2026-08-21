'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const snapshotItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const recurringOrderSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceOrder: { type: Schema.Types.ObjectId, ref: 'Order' },
    items: [snapshotItemSchema],
    address: { type: Schema.Types.Mixed },
    deliveryType: { type: String, enum: ['STANDARD', 'EXPRESS'], default: 'STANDARD' },
    paymentMethod: { type: String },

    intervalDays: { type: Number, default: 30, min: 7 },
    nextRefillDate: { type: Date, required: true },
    status: { type: String, enum: ['ACTIVE', 'PAUSED', 'CANCELLED'], default: 'ACTIVE', index: true },

    notificationHistory: [
      {
        sentAt: { type: Date, default: Date.now },
        message: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecurringOrder', recurringOrderSchema);
