'use strict';

const router = require('express').Router();
const controller = require('./cart.controller');
const validation = require('./cart.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateBody } = require('../../middleware/validation.middleware');

router.use(authenticate);

router.get('/', controller.getCart);
router.post('/items', validateBody(validation.addItem), controller.addItem);
router.patch('/items/:productId', validateBody(validation.updateItem), controller.updateItem);
router.delete('/items/:productId', controller.removeItem);
router.delete('/', controller.clearCart);
router.post('/coupon', validateBody(validation.applyCoupon), controller.applyCoupon);
router.patch('/notes', validateBody(validation.updateNotes), controller.setNotes);

module.exports = router;
