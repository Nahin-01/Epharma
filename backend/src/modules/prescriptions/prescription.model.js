'use strict';

const mongoose = require('mongoose');
const { PRESCRIPTION_STATUS } = require('../../constants/orderStatus');

const { Schema } = mongoose;

const matchedMedicineSchema = new Schema(
  {
    text: { type: String },
    productName: { type: String },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const ocrResultSchema = new Schema(
  {
    provider: { type: String },
    rawText: { type: String },
    overallConfidence: { type: Number, min: 0, max: 1 },
    matchedMedicines: [matchedMedicineSchema],
    processedAt: { type: Date },
  },
  { _id: false }
);

const fileSchema = new Schema(
  {
    storageKey: { type: String, required: true },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    ocrResult: { type: ocrResultSchema, default: null },
  },
  { timestamps: false }
);

const prescriptionSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    productRequest: { type: Schema.Types.ObjectId, ref: 'ProductRequest', default: null },

    files: [fileSchema],

    source: {
      type: String,
      enum: ['UPLOAD', 'CHECKOUT', 'PRODUCT_REQUEST'],
      default: 'UPLOAD',
    },

    status: {
      type: String,
      enum: Object.values(PRESCRIPTION_STATUS),
      default: PRESCRIPTION_STATUS.UPLOADED,
      index: true,
    },

    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date },
    reviewerNotes: { type: String },
    clarificationHistory: [
      {
        note: { type: String },
        by: { type: Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
      },
    ],

    validUntil: { type: Date },
  },
  { timestamps: true }
);

prescriptionSchema.index({ customer: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
