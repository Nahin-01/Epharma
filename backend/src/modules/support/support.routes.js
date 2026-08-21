'use strict';

const router = require('express').Router();
const controller = require('./support.controller');
const validation = require('./support.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

router.post('/', validateBody(validation.createTicket), controller.createTicket);
router.get('/mine', controller.listMine);

router.get('/', requirePermission(PERMISSIONS.SUPPORT_MANAGE), controller.listAll);
router.get('/:id', controller.getTicket);
router.post('/:id/messages', validateBody(validation.addMessage), controller.addMessage);
router.patch('/:id/status', requirePermission(PERMISSIONS.SUPPORT_MANAGE), validateBody(validation.updateStatus), controller.updateStatus);
router.patch('/:id/assign', requirePermission(PERMISSIONS.SUPPORT_MANAGE), validateBody(validation.assign), controller.assign);

module.exports = router;
