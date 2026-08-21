'use strict';

const router = require('express').Router();
const controller = require('./admin.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

router.get('/audit-logs', requirePermission(PERMISSIONS.AUDIT_VIEW), controller.listAuditLogs);
router.get('/roles', requirePermission(PERMISSIONS.ADMIN_MANAGE), controller.listRoles);
router.get('/permissions', requirePermission(PERMISSIONS.ADMIN_MANAGE), controller.listPermissions);

module.exports = router;
