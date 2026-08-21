import 'package:flutter/material.dart';

import 'app_colors.dart';

class OrderStatusInfo {
  final String label;
  final Color color;

  const OrderStatusInfo(this.label, this.color);
}

const Map<String, OrderStatusInfo> orderStatusMap = {
  'PENDING': OrderStatusInfo('Pending', AppColors.amber600),
  'CONFIRMED': OrderStatusInfo('Confirmed', AppColors.brand600),
  'PROCESSING': OrderStatusInfo('Processing', AppColors.brand600),
  'PACKED': OrderStatusInfo('Packed', AppColors.brand700),
  'DISPATCHED': OrderStatusInfo('Dispatched', AppColors.accent600),
  'OUT_FOR_DELIVERY': OrderStatusInfo('Out for delivery', AppColors.accent600),
  'DELIVERED': OrderStatusInfo('Delivered', AppColors.emerald600),
  'CANCELLED': OrderStatusInfo('Cancelled', AppColors.slate500),
  'RETURNED': OrderStatusInfo('Returned', AppColors.red600),
  'REFUNDED': OrderStatusInfo('Refunded', AppColors.red600),
};

const List<String> cancellableStatuses = ['PENDING', 'CONFIRMED'];

OrderStatusInfo orderStatusInfo(String status) =>
    orderStatusMap[status] ?? OrderStatusInfo(status, AppColors.slate500);
