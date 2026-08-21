'use strict';

const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../../constants/orderStatus');

const { Schema } = mongoose;

const refundSchema = new Schema(
  {
    amount: { type: Number, required: true },
    transactionId: { type: String },
    status: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    method: {
      type: String,
      enum: ['COD', 'BKASH', 'NAGAD', 'ROCKET', 'SSLCOMMERZ', 'CARD'],
      required: true,
    },
    provider: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'BDT' },

    transactionId: { type: String, index: true },
    gatewayResponse: { type: Schema.Types.Mixed },

    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING, index: true },
    refunds: [refundSchema],

    initiatedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
