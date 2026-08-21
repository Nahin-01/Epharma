'use strict';

const mongoose = require('mongoose');
const { ROLES } = require('../../constants/roles');

const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    codeHash: { type: String },
    purpose: { type: String, enum: ['LOGIN', 'REGISTER', 'RESET_PASSWORD', 'VERIFY_PHONE'] },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      match: [/^\+?[0-9]{10,15}$/, 'Invalid phone number'],
    },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    permissions: [{ type: String }],

    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    tokenVersion: { type: Number, default: 0 },
    otp: { type: otpSchema, select: false },

    supabaseId: { type: String, unique: true, sparse: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

userSchema.pre('validate', function ensureIdentifier(next) {
  if (!this.email && !this.phone && !this.supabaseId) {
    return next(new Error('A user requires at least one of email, phone or supabaseId'));
  }
  return next();
});

module.exports = mongoose.model('User', userSchema);
