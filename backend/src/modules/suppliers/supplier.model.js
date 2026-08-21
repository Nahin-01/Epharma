'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const supplierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    licenseNumber: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
