'use strict';

const router = require('express').Router();
const controller = require('./recurringOrder.controller');
const validation = require('./recurringOrder.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateBody } = require('../../middleware/validation.middleware');

router.use(authenticate);

router.get('/', controller.listMine);
router.get('/:id', controller.getOne);
router.patch('/:id', validateBody(validation.updateSchedule), controller.update);
router.post('/:id/skip', controller.skipNext);
router.post('/:id/cancel', controller.cancel);
router.post('/:id/reorder', controller.reorderToCart);

module.exports = router;
