'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String },
    message: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const supportTicketSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true },
    channel: { type: String, enum: ['CHAT', 'EMAIL', 'PHONE'], default: 'CHAT' },
    relatedOrder: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    relatedPrescription: { type: Schema.Types.ObjectId, ref: 'Prescription', default: null },

    messages: [messageSchema],

    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
