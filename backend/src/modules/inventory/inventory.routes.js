'use strict';

const router = require('express').Router();
const controller = require('./inventory.controller');
const validation = require('./inventory.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate, requirePermission(PERMISSIONS.INVENTORY_VIEW));

router.get('/batches', validateQuery(validation.listBatchesQuery), controller.listBatches);
router.get('/batches/:id', controller.getBatch);
router.get('/scan', controller.scan);

router.post('/batches', requirePermission(PERMISSIONS.INVENTORY_UPDATE), validateBody(validation.createBatch), controller.createBatch);
router.patch('/batches/:id', requirePermission(PERMISSIONS.INVENTORY_UPDATE), validateBody(validation.updateBatch), controller.updateBatch);

module.exports = router;
