'use strict';

const router = require('express').Router();
const Joi = require('joi');
const controller = require('./order.controller');
const validation = require('./order.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

router.post('/checkout', validateBody(validation.checkout), controller.checkout);
router.get('/mine', controller.listMine);

router.get('/', requirePermission(PERMISSIONS.ORDER_VIEW), validateQuery(validation.listQuery), controller.listAll);
router.get('/:id', controller.getById);

router.patch('/:id/status', requirePermission(PERMISSIONS.ORDER_UPDATE), validateBody(validation.updateStatus), controller.updateStatus);
router.post(
  '/:id/cancel',
  validateBody(Joi.object({ reason: Joi.string().max(500).allow('') })),
  controller.cancel
);

module.exports = router;
