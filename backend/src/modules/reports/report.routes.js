'use strict';

const router = require('express').Router();
const controller = require('./report.controller');
const validation = require('./report.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateQuery } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate, requirePermission(PERMISSIONS.REPORT_VIEW));

router.get('/dashboard', controller.dashboard);
router.get('/sales', validateQuery(validation.dateRangeQuery), controller.sales);
router.get('/inventory', controller.inventory);
router.get('/prescriptions', validateQuery(validation.dateRangeQuery), controller.prescriptions);
router.get('/delivery', validateQuery(validation.dateRangeQuery), controller.delivery);

module.exports = router;
