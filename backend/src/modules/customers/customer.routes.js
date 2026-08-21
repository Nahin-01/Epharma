'use strict';

const router = require('express').Router();
const controller = require('./customer.controller');
const validation = require('./customer.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { PERMISSIONS } = require('../../constants/permissions');

router.use(authenticate);

router.get('/me', controller.getMyProfile);
router.patch('/me', validateBody(validation.updateProfile), controller.updateMyProfile);

router.get('/me/addresses', controller.listAddresses);
router.post('/me/addresses', validateBody(validation.address), controller.addAddress);
router.patch('/me/addresses/:addressId', validateBody(validation.updateAddress), controller.updateAddress);
router.delete('/me/addresses/:addressId', controller.deleteAddress);

// Staff/admin customer management
router.get('/', requirePermission(PERMISSIONS.CUSTOMER_VIEW), controller.listCustomers);
router.get('/:id', requirePermission(PERMISSIONS.CUSTOMER_VIEW), controller.getCustomer);

module.exports = router;
