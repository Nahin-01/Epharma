'use strict';

const router = require('express').Router();
const controller = require('./category.controller');
const validation = require('./category.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

// Public catalog browsing
router.get('/tree', controller.getTree);
router.get('/', controller.list);
router.get('/:id', controller.getById);

// Admin management
router.post('/', authenticate, requirePermission(PERMISSIONS.PRODUCT_CREATE), validateBody(validation.createCategory), controller.create);
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_UPDATE), validateBody(validation.updateCategory), controller.update);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_DELETE), controller.remove);

module.exports = router;
