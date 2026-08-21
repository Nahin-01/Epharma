'use strict';

const router = require('express').Router();
const controller = require('./delivery.controller');
const validation = require('./delivery.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.get('/zones/charge', controller.resolveCharge);

router.use(authenticate);

router.get('/order/:orderId', controller.getByOrder);
router.post('/order/:orderId/sync', requirePermission(PERMISSIONS.DELIVERY_MANAGE), controller.syncTracking);
router.get('/', requirePermission(PERMISSIONS.DELIVERY_MANAGE), controller.listAll);

router.get('/zones', requirePermission(PERMISSIONS.DELIVERY_MANAGE), controller.zones.list);
router.post('/zones', requirePermission(PERMISSIONS.DELIVERY_MANAGE), validateBody(validation.createZone), controller.zones.create);
router.patch('/zones/:id', requirePermission(PERMISSIONS.DELIVERY_MANAGE), validateBody(validation.updateZone), controller.zones.update);
router.delete('/zones/:id', requirePermission(PERMISSIONS.DELIVERY_MANAGE), controller.zones.remove);

module.exports = router;
