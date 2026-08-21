'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const warehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    district: { type: String, required: true },
    address: { type: String },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warehouse', warehouseSchema);
