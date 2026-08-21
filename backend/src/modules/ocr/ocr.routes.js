'use strict';

const router = require('express').Router();
const controller = require('./ocr.controller');
const validation = require('./ocr.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate, requirePermission(PERMISSIONS.PRESCRIPTION_VIEW));

router.get('/:prescriptionId/:fileId', controller.getResult);
router.post('/reprocess', requirePermission(PERMISSIONS.PRESCRIPTION_REVIEW), validateBody(validation.reprocess), controller.reprocess);

module.exports = router;
