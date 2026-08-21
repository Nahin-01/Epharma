'use strict';

const router = require('express').Router();
const controller = require('./warehouse.controller');
const validation = require('./warehouse.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate, requirePermission(PERMISSIONS.INVENTORY_VIEW));

router.get('/', controller.list);
router.get('/:id', controller.getById);

router.post('/', requirePermission(PERMISSIONS.INVENTORY_UPDATE), validateBody(validation.createWarehouse), controller.create);
router.patch('/:id', requirePermission(PERMISSIONS.INVENTORY_UPDATE), validateBody(validation.updateWarehouse), controller.update);
router.delete('/:id', requirePermission(PERMISSIONS.INVENTORY_UPDATE), controller.remove);

module.exports = router;
