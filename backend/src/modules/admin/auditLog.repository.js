'use strict';

const AuditLog = require('./auditLog.model');
const { createRepository } = require('../../utils/crud.factory');

const base = createRepository(AuditLog);

module.exports = {
  Model: AuditLog,
  ...base,

  async search({ action, entityType, actor, page, limit } = {}) {
    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (actor) filter.actor = actor;
    return base.list({ filter, page, limit, populate: { path: 'actor', select: 'name email role' } });
  },
};
