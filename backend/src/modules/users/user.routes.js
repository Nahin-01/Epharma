'use strict';

const router = require('express').Router();
const controller = require('./user.controller');
const validation = require('./user.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

router.get('/me', controller.getMe);

router.get('/', requirePermission(PERMISSIONS.ADMIN_MANAGE), validateQuery(validation.listUsersQuery), controller.listUsers);
router.post('/', requirePermission(PERMISSIONS.ADMIN_MANAGE), validateBody(validation.createStaffUser), controller.createStaffUser);
router.get('/:id', requirePermission(PERMISSIONS.ADMIN_MANAGE), controller.getUser);
router.patch('/:id', requirePermission(PERMISSIONS.ADMIN_MANAGE), validateBody(validation.updateUser), controller.updateUser);
router.delete('/:id', requirePermission(PERMISSIONS.ADMIN_MANAGE), controller.deactivateUser);

module.exports = router;
