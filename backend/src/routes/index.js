'use strict';

const router = require('express').Router();

router.use('/health', require('../modules/health/health.routes'));
router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/user.routes'));
router.use('/customers', require('../modules/customers/customer.routes'));

router.use('/products', require('../modules/products/product.routes'));
router.use('/categories', require('../modules/categories/category.routes'));
router.use('/brands', require('../modules/brands/brand.routes'));
router.use('/generics', require('../modules/generics/generic.routes'));

router.use('/inventory', require('../modules/inventory/inventory.routes'));
router.use('/warehouses', require('../modules/warehouses/warehouse.routes'));
router.use('/suppliers', require('../modules/suppliers/supplier.routes'));

router.use('/prescriptions', require('../modules/prescriptions/prescription.routes'));
router.use('/ocr', require('../modules/ocr/ocr.routes'));

router.use('/cart', require('../modules/cart/cart.routes'));
router.use('/orders', require('../modules/orders/order.routes'));
router.use('/recurring-orders', require('../modules/recurringOrders/recurringOrder.routes'));
router.use('/coupons', require('../modules/coupons/coupon.routes'));

router.use('/payments', require('../modules/payments/payment.routes'));
router.use('/delivery', require('../modules/delivery/delivery.routes'));

router.use('/doctors', require('../modules/doctors/doctor.routes'));
router.use('/appointments', require('../modules/appointments/appointment.routes'));

router.use('/notifications', require('../modules/notifications/notification.routes'));
router.use('/product-requests', require('../modules/productRequests/productRequest.routes'));
router.use('/support', require('../modules/support/support.routes'));

router.use('/reports', require('../modules/reports/report.routes'));
router.use('/admin', require('../modules/admin/admin.routes'));

router.use('/files', require('./files.routes'));

module.exports = router;
