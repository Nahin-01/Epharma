'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    bnName: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String },
    icon: { type: String },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ name: 'text', bnName: 'text' });

module.exports = mongoose.model('Category', categorySchema);
