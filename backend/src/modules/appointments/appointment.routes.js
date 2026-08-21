'use strict';

const router = require('express').Router();
const controller = require('./appointment.controller');
const validation = require('./appointment.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

router.post('/', validateBody(validation.bookAppointment), controller.book);
router.get('/mine', controller.listMine);
router.get('/doctor/:doctorId', requirePermission(PERMISSIONS.DOCTOR_UPDATE), controller.listForDoctor);
router.patch('/:id/status', validateBody(validation.updateStatus), controller.updateStatus);

module.exports = router;
