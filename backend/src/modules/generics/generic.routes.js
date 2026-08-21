'use strict';

const router = require('express').Router();
const controller = require('./generic.controller');
const validation = require('./generic.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.get('/search', controller.search);
router.get('/', controller.list);
router.get('/:id', controller.getById);

router.post('/', authenticate, requirePermission(PERMISSIONS.PRODUCT_CREATE), validateBody(validation.createGeneric), controller.create);
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_UPDATE), validateBody(validation.updateGeneric), controller.update);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.PRODUCT_DELETE), controller.remove);

module.exports = router;
