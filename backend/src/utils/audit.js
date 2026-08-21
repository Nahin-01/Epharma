'use strict';

const logger = require('./logger');

/**
 * Writes an audit-trail entry for sensitive actions (prescription review,
 * order status changes, role/permission changes, payment reconciliation).
 * Lazily requires the model to avoid circular-require issues at module load
 * time (audit.js is imported by many services before models finish
 * registering).
 */
async function recordAudit({ actorId, actorRole, action, entityType, entityId, changes = null, req = null }) {
  try {
    const AuditLog = require('../modules/admin/auditLog.model');
    await AuditLog.create({
      actor: actorId || null,
      actorRole: actorRole || 'SYSTEM',
      action,
      entityType,
      entityId: entityId || null,
      changes,
      ip: req ? req.ip : undefined,
      userAgent: req ? req.get('user-agent') : undefined,
    });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    logger.error(`Failed to write audit log for action "${action}": ${err.message}`);
  }
}

module.exports = { recordAudit };
