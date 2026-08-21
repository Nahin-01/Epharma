'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'ORDER',
        'PRESCRIPTION',
        'APPOINTMENT',
        'RECURRING_ORDER',
        'PROMOTION',
        'SYSTEM',
        'PRODUCT_REQUEST',
        'SUPPORT',
      ],
      default: 'SYSTEM',
    },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    channel: { type: String, enum: ['IN_APP', 'SMS'], default: 'IN_APP' },
    isRead: { type: Boolean, default: false },
    deliveryStatus: { type: String, enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'], default: 'PENDING' },
    deliveryMeta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
