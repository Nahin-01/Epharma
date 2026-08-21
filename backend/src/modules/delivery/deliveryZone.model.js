'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const deliveryZoneSchema = new Schema(
  {
    district: { type: String, required: true },
    area: { type: String },
    charge: { type: Number, required: true, min: 0 },
    expressCharge: { type: Number },
    estimatedDays: { type: Number, default: 2 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

deliveryZoneSchema.index({ district: 1, area: 1 }, { unique: true });

module.exports = mongoose.model('DeliveryZone', deliveryZoneSchema);
