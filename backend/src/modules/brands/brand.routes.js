'use strict';

const router = require('express').Router();
const controller = require('./brand.controller');
const validation = require('./brand.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.get('/', controller.list);
router.get('/:id', controller.getById);

router.post('/', authenticate, requirePermission(PERMISSIONS.PRODUCT_CREATE), validateBody(validation.createBrand), controller.create);
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_UPDATE), validateBody(validation.updateBrand), controller.update);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_DELETE), controller.remove);

module.exports = router;
