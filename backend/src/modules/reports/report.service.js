'use strict';

function buildDateFilter(from, to, field = 'createdAt') {
  const filter = {};
  if (from || to) {
    filter[field] = {};
    if (from) filter[field].$gte = new Date(from);
    if (to) filter[field].$lte = new Date(to);
  }
  return filter;
}

async function salesReport({ from, to } = {}) {
  const Order = require('../orders/order.model');
  const match = { ...buildDateFilter(from, to), status: { $ne: 'CANCELLED' } };

  const [summary] = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        totalDiscount: { $sum: '$discountAmount' },
        avgOrderValue: { $avg: '$total' },
      },
    },
  ]);

  const byStatus = await Order.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byPaymentMethod = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
  ]);

  return {
    summary: summary || { totalOrders: 0, totalRevenue: 0, totalDiscount: 0, avgOrderValue: 0 },
    byStatus,
    byPaymentMethod,
  };
}

async function inventoryReport() {
  const inventoryService = require('../inventory/inventory.service');
  const { lowStockCount, expiringCount, lowStock, expiring } = await inventoryService.scanLowStockAndExpiring();
  return { lowStockCount, expiringCount, lowStock, expiring };
}

async function prescriptionsReport({ from, to } = {}) {
  const Prescription = require('../prescriptions/prescription.model');
  const match = buildDateFilter(from, to);
  const byStatus = await Prescription.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const total = await Prescription.countDocuments(match);
  return { total, byStatus };
}

async function deliveryReport({ from, to } = {}) {
  const Delivery = require('../delivery/delivery.model');
  const match = buildDateFilter(from, to);
  const byStatus = await Delivery.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const total = await Delivery.countDocuments(match);
  return { total, byStatus };
}

async function dashboardSummary() {
  const Order = require('../orders/order.model');
  const Prescription = require('../prescriptions/prescription.model');
  const User = require('../users/user.model');
  const { ROLES } = require('../../constants/roles');

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [ordersToday, revenueTodayAgg, pendingPrescriptions, totalCustomers, pendingOrders] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfToday }, status: { $ne: 'CANCELLED' } } },
      { $group: { _id: null, revenue: { $sum: '$total' } } },
    ]),
    Prescription.countDocuments({ status: { $in: ['UPLOADED', 'UNDER_REVIEW'] } }),
    User.countDocuments({ role: ROLES.CUSTOMER }),
    Order.countDocuments({ status: 'PENDING' }),
  ]);

  const inventoryService = require('../inventory/inventory.service');
  const { lowStockCount, expiringCount } = await inventoryService.scanLowStockAndExpiring();

  return {
    ordersToday,
    revenueToday: revenueTodayAgg[0]?.revenue || 0,
    pendingPrescriptions,
    pendingOrders,
    totalCustomers,
    lowStockCount,
    expiringCount,
  };
}

module.exports = { salesReport, inventoryReport, prescriptionsReport, deliveryReport, dashboardSummary };
