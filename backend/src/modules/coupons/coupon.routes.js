'use strict';

const router = require('express').Router();
const Joi = require('joi');
const controller = require('./coupon.controller');
const validation = require('./coupon.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

const previewSchema = Joi.object({
  code: Joi.string().required(),
  subtotal: Joi.number().min(0).required(),
});

router.use(authenticate);

router.post('/preview', validateBody(previewSchema), controller.preview);

router.get('/', requirePermission(PERMISSIONS.COUPON_MANAGE), controller.list);
router.get('/:id', requirePermission(PERMISSIONS.COUPON_MANAGE), controller.getById);
router.post('/', requirePermission(PERMISSIONS.COUPON_MANAGE), validateBody(validation.createCoupon), controller.create);
router.patch('/:id', requirePermission(PERMISSIONS.COUPON_MANAGE), validateBody(validation.updateCoupon), controller.update);
router.delete('/:id', requirePermission(PERMISSIONS.COUPON_MANAGE), controller.remove);

module.exports = router;
