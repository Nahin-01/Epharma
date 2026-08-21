'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const availabilitySlotSchema = new Schema(
  {
    day: { type: String, enum: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], required: true },
    startTime: { type: String, required: true }, // "HH:mm"
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const chamberSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String },
  district: { type: String, required: true },
  upazilla: { type: String },
  phone: { type: String },
  consultationFee: { type: Number, default: 0 },
  availability: [availabilitySlotSchema],
});

const doctorSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    bnName: { type: String },
    specialty: { type: String, required: true, index: true },
    qualifications: [{ type: String }],
    registrationNumber: { type: String },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String },
    profileImage: { type: String },
    chambers: [chamberSchema],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.index({ name: 'text', bnName: 'text', specialty: 'text' });
doctorSchema.index({ 'chambers.district': 1 });
doctorSchema.index({ 'chambers.upazilla': 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
