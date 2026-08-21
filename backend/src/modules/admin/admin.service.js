'use strict';

const auditLogRepository = require('./auditLog.repository');
const { ROLES } = require('../../constants/roles');
const { PERMISSIONS, ROLE_PERMISSIONS } = require('../../constants/permissions');

async function listAuditLogs(query) {
  return auditLogRepository.search(query);
}

function listRoles() {
  return Object.values(ROLES).map((role) => ({
    role,
    permissions: role === ROLES.SUPER_ADMIN ? Object.values(PERMISSIONS) : ROLE_PERMISSIONS[role] || [],
  }));
}

function listPermissions() {
  return Object.values(PERMISSIONS);
}

module.exports = { listAuditLogs, listRoles, listPermissions };
