'use strict';

const router = require('express').Router();
const controller = require('./doctor.controller');
const validation = require('./doctor.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody, validateQuery } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

// Public directory & search
router.get('/specialties', controller.listSpecialties);
router.get('/search', validateQuery(validation.searchQuery), controller.search);
router.get('/', controller.list);
router.get('/:id', controller.getById);

// Admin management
router.post('/', authenticate, requirePermission(PERMISSIONS.DOCTOR_CREATE), validateBody(validation.createDoctor), controller.create);
router.patch('/:id', authenticate, requirePermission(PERMISSIONS.DOCTOR_UPDATE), validateBody(validation.updateDoctor), controller.update);
router.delete('/:id', authenticate, requirePermission(PERMISSIONS.DOCTOR_UPDATE), controller.remove);

module.exports = router;
