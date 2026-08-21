'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    doctor: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
    chamberId: { type: Schema.Types.ObjectId, required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    date: { type: Date, required: true },
    timeSlot: { type: String, required: true }, // e.g. "18:00-18:30"

    consultationFee: { type: Number, default: 0 },
    notes: { type: String },

    status: {
      type: String,
      enum: ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
      default: 'REQUESTED',
      index: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, date: 1, timeSlot: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['REQUESTED', 'CONFIRMED'] } } });

module.exports = mongoose.model('Appointment', appointmentSchema);
