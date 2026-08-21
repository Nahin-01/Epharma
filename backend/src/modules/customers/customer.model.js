'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    label: { type: String, default: 'Home' },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    district: { type: String, required: true },
    area: { type: String },
    thana: { type: String },
    postCode: { type: String },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const customerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'] },
    preferredLanguage: { type: String, enum: ['en', 'bn'], default: 'en' },
    addresses: [addressSchema],
    preferences: {
      smsNotifications: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
      recurringOrderReminders: { type: Boolean, default: true },
    },
    loyaltyPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);
