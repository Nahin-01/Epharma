'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const brandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    bnName: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brand', brandSchema);
