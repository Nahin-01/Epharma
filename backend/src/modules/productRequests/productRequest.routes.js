'use strict';

const router = require('express').Router();
const controller = require('./productRequest.controller');
const validation = require('./productRequest.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

router.post('/', validateBody(validation.createRequest), controller.create);
router.get('/mine', controller.listMine);

router.get('/', requirePermission(PERMISSIONS.CUSTOMER_VIEW), controller.listAll);
router.get('/:id', controller.getById);
router.patch('/:id/status', requirePermission(PERMISSIONS.CUSTOMER_VIEW), validateBody(validation.updateStatus), controller.updateStatus);

module.exports = router;
