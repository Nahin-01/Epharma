import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/formatters.dart';
import '../../core/order_status.dart';
import '../../models/order.dart';
import '../../models/payment.dart';
import '../../network/api_exception.dart';
import '../../services/order_service.dart';
import '../../services/payment_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_loader.dart';
import '../../widgets/empty_state.dart';
import '../root/root_shell.dart';

class OrderDetailScreen extends StatefulWidget {
  static const routeName = '/order-detail';

  final String orderId;
  final bool justPlaced;

  const OrderDetailScreen({super.key, required this.orderId, this.justPlaced = false});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  final _orderService = OrderService();
  final _paymentService = PaymentService();

  Order? _order;
  Payment? _payment;
  bool _loading = true;
  bool _cancelling = false;
  bool _completingPayment = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final order = await _orderService.getById(widget.orderId);
      Payment? payment;
      try {
        payment = await _paymentService.getByOrder(widget.orderId);
      } catch (_) {
        // Payment record may not be visible yet right after checkout - the
        // order itself still renders fine without it.
      }
      setState(() {
        _order = order;
        _payment = payment;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not load this order right now.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _cancelOrder() async {
    setState(() => _cancelling = true);
    try {
      final order = await _orderService.cancel(widget.orderId);
      setState(() => _order = order);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  /// Demo/sandbox payment completion - see PaymentService.completeMock. No
  /// real gateway redirect exists yet, so this is how a non-COD checkout
  /// reaches PAID during development or a live demo.
  Future<void> _completeMockPayment() async {
    final payment = _payment;
    if (payment == null) return;
    setState(() => _completingPayment = true);
    try {
      await _paymentService.completeMock(payment.transactionId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Payment marked as completed (demo gateway)')),
        );
      }
      await _load();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _completingPayment = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('Order details')),
      body: _loading
          ? const AppLoader()
          : (_error != null || _order == null)
              ? ErrorState(message: _error ?? 'Order not found.', onRetry: _load)
              : _buildBody(_order!),
    );
  }

  Widget _buildBody(Order order) {
    final statusInfo = orderStatusInfo(order.status);

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (widget.justPlaced)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(14)),
              child: const Row(
                children: [
                  Icon(Icons.check_circle_rounded, color: AppColors.brand600),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Your order has been placed! We will confirm it shortly.',
                      style: TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w600, fontSize: 12.5),
                    ),
                  ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.slate100)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('#${order.orderNumber}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(color: statusInfo.color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                      child: Text(statusInfo.label, style: TextStyle(color: statusInfo.color, fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text('Placed ${formatDateTime(order.placedAt ?? order.createdAt)}', style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _Section(
            title: 'Items',
            child: Column(
              children: order.items
                  .map(
                    (item) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text('${item.name} × ${item.quantity}', style: const TextStyle(fontSize: 13)),
                          ),
                          Text(formatBDT(item.subtotal), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 16),
          _Section(
            title: 'Delivery address',
            child: Text(
              '${order.address.name} — ${order.address.phone}\n${order.address.shortLine}',
              style: const TextStyle(fontSize: 13, color: AppColors.slate600, height: 1.5),
            ),
          ),
          if (order.statusHistory.isNotEmpty) ...[
            const SizedBox(height: 16),
            _Section(
              title: 'Status history',
              child: Column(
                children: order.statusHistory
                    .map(
                      (event) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(Icons.circle, size: 7, color: AppColors.brand400),
                            const SizedBox(width: 8),
                            Expanded(child: Text(orderStatusInfo(event.status).label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600))),
                            Text(formatDateTime(event.at), style: const TextStyle(fontSize: 11, color: AppColors.slate400)),
                          ],
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
          const SizedBox(height: 16),
          _Section(
            title: 'Payment',
            child: Column(
              children: [
                _KeyValueRow(label: 'Method', value: order.paymentMethod),
                _KeyValueRow(label: 'Status', value: order.paymentStatus),
                const Divider(height: 20),
                _KeyValueRow(label: 'Subtotal', value: formatBDT(order.subtotal)),
                if (order.discountAmount > 0) _KeyValueRow(label: 'Discount', value: '-${formatBDT(order.discountAmount)}'),
                _KeyValueRow(label: 'Delivery', value: formatBDT(order.deliveryCharge)),
                const Divider(height: 20),
                _KeyValueRow(label: 'Total', value: formatBDT(order.total), bold: true),
                if (_payment != null && _payment!.method != 'COD' && _payment!.status == 'PROCESSING') ...[
                  const SizedBox(height: 14),
                  AppButton(
                    label: 'Complete payment (demo)',
                    loading: _completingPayment,
                    onPressed: _completeMockPayment,
                  ),
                ],
              ],
            ),
          ),
          if (cancellableStatuses.contains(order.status)) ...[
            const SizedBox(height: 20),
            AppButton(
              label: 'Cancel order',
              variant: AppButtonVariant.outline,
              loading: _cancelling,
              onPressed: _cancelOrder,
            ),
          ],
          const SizedBox(height: 20),
          AppButton(
            label: 'Continue shopping',
            variant: AppButtonVariant.ghost,
            onPressed: () => Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const RootShell()),
              (route) => false,
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;

  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.slate100)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.slate800)),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}

class _KeyValueRow extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;

  const _KeyValueRow({required this.label, required this.value, this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: bold ? 14 : 12.5, color: AppColors.slate500, fontWeight: bold ? FontWeight.w700 : FontWeight.w500)),
          Text(value, style: TextStyle(fontSize: bold ? 16 : 13, fontWeight: bold ? FontWeight.w800 : FontWeight.w600, color: bold ? AppColors.brand700 : AppColors.slate800)),
        ],
      ),
    );
  }
}
