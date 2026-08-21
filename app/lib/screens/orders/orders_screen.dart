import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../core/formatters.dart';
import '../../core/order_status.dart';
import '../../models/order.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../services/order_service.dart';
import '../../widgets/app_loader.dart';
import '../../widgets/empty_state.dart';
import '../auth/login_screen.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  static const routeName = '/orders';

  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _orderService = OrderService();

  List<Order>? _orders;
  bool _loading = true;
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
      final page = await _orderService.listMine(limit: 20);
      setState(() => _orders = page.items);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not load your orders right now.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('My Orders')),
      body: !auth.isAuthenticated
          ? EmptyState(
              icon: Icons.receipt_long_outlined,
              title: 'Sign in to view your orders',
              message: 'Track deliveries and reorder past purchases once you sign in.',
              actionLabel: 'Sign in',
              onAction: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
            )
          : _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const AppLoader();
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);
    if (_orders == null || _orders!.isEmpty) {
      return const EmptyState(
        icon: Icons.receipt_long_outlined,
        title: 'No orders yet',
        message: 'Once you place an order, it will show up here with live tracking.',
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _orders!.length,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) => _OrderTile(order: _orders![index]),
      ),
    );
  }
}

class _OrderTile extends StatelessWidget {
  final Order order;

  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    final statusInfo = orderStatusInfo(order.status);
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id))),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.slate100)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('#${order.orderNumber}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(color: statusInfo.color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                  child: Text(statusInfo.label, style: TextStyle(color: statusInfo.color, fontSize: 11, fontWeight: FontWeight.w700)),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text('Placed ${formatDate(order.placedAt ?? order.createdAt)}', style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${order.items.length} item${order.items.length == 1 ? '' : 's'}', style: const TextStyle(fontSize: 12.5, color: AppColors.slate600)),
                Text(formatBDT(order.total), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.brand700)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
