'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const productRequestSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productName: { type: String, required: true },
    description: { type: String },
    prescription: { type: Schema.Types.ObjectId, ref: 'Prescription', default: null },

    status: {
      type: String,
      enum: ['PENDING', 'REVIEWING', 'SOURCED', 'REJECTED', 'FULFILLED'],
      default: 'PENDING',
      index: true,
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProductRequest', productRequestSchema);
