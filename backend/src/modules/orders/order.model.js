'use strict';

const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../constants/orderStatus');

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    mrp: { type: Number },
    subtotal: { type: Number, required: true },
    prescriptionRequired: { type: Boolean, default: false },
  },
  { _id: false }
);

const addressSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    district: { type: String, required: true },
    area: { type: String },
    thana: { type: String },
    postCode: { type: String },
  },
  { _id: false }
);

const allocationSchema = new Schema(
  {
    batch: { type: Schema.Types.ObjectId, ref: 'InventoryBatch', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    items: [orderItemSchema],
    prescription: { type: Schema.Types.ObjectId, ref: 'Prescription', default: null },

    address: { type: addressSnapshotSchema, required: true },
    deliveryType: { type: String, enum: ['STANDARD', 'EXPRESS'], default: 'STANDARD' },
    deliveryDate: { type: Date },
    deliveryCharge: { type: Number, default: 0 },

    coupon: {
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },

    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    notes: { type: String },

    paymentMethod: {
      type: String,
      enum: ['COD', 'BKASH', 'NAGAD', 'ROCKET', 'SSLCOMMERZ', 'CARD'],
      required: true,
    },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },

    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    statusHistory: [statusHistorySchema],

    inventoryAllocations: [allocationSchema],
    inventoryCommitted: { type: Boolean, default: false },

    isRecurring: { type: Boolean, default: false },
    recurringOrder: { type: Schema.Types.ObjectId, ref: 'RecurringOrder', default: null },

    placedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
