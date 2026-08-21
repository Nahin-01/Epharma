'use strict';

const mongoose = require('mongoose');

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: 'SYSTEM' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, index: true },
    entityId: { type: Schema.Types.Mixed, default: null },
    changes: { type: Schema.Types.Mixed, default: null },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
