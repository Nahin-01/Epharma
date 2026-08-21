'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const historyEntrySchema = new Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    raw: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const deliverySchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    courierProvider: { type: String },
    trackingId: { type: String, index: true },

    status: {
      type: String,
      enum: ['PENDING', 'PICKUP_PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    history: [historyEntrySchema],

    charge: { type: Number, default: 0 },
    codAmount: { type: Number, default: 0 },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema);
