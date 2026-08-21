'use strict';

const router = require('express').Router();
const controller = require('./payment.controller');
const validation = require('./payment.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

// Public/unauthenticated gateway callbacks (gateways call these directly).
router.post('/callback/:provider', validateBody(validation.callback), controller.callback);
router.get('/callback/:provider', controller.callback);
router.get('/mock/:transactionId/complete', controller.mockComplete);

router.use(authenticate);

router.get('/order/:orderId', controller.getByOrder);
router.get('/', requirePermission(PERMISSIONS.PAYMENT_MANAGE), controller.listAll);
router.post('/:id/refund', requirePermission(PERMISSIONS.PAYMENT_MANAGE), validateBody(validation.refund), controller.refund);

module.exports = router;
