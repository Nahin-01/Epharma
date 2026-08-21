'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const genericSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    bnName: { type: String, trim: true },
    description: { type: String },
    therapeuticClass: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

genericSchema.index({ name: 'text', bnName: 'text' });

module.exports = mongoose.model('Generic', genericSchema);
