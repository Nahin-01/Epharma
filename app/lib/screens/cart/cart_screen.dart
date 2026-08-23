import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../core/formatters.dart';
import '../../models/cart.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_loader.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/product_image.dart';
import '../auth/login_screen.dart';
import '../checkout/checkout_screen.dart';

class CartScreen extends StatefulWidget {
  static const routeName = '/cart';

  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _couponController = TextEditingController();
  bool _applyingCoupon = false;

  @override
  void dispose() {
    _couponController.dispose();
    super.dispose();
  }

  // CartProvider.updateItem/removeItem update the screen immediately from
  // data already on hand and only roll back if the request actually fails,
  // so there's nothing here that needs a busy/disabled state to wait on.
  Future<void> _changeQuantity(String productId, int quantity) async {
    final cartProvider = context.read<CartProvider>();
    try {
      if (quantity <= 0) {
        await cartProvider.removeItem(productId);
      } else {
        await cartProvider.updateItem(productId, quantity);
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _applyCoupon() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    setState(() => _applyingCoupon = true);
    try {
      await context.read<CartProvider>().applyCoupon(code);
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } finally {
      if (mounted) setState(() => _applyingCoupon = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('My Bag')),
      body: !auth.isAuthenticated
          ? EmptyState(
              icon: Icons.shopping_bag_outlined,
              title: 'Sign in to view your bag',
              message: 'Your bag is saved to your account so it follows you across devices.',
              actionLabel: 'Sign in',
              onAction: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
            )
          : Consumer<CartProvider>(
              builder: (context, cartProvider, _) {
                if (!cartProvider.initialized) return const AppLoader(label: 'Loading your bag…');
                final cart = cartProvider.cart;
                if (cart.isEmpty) {
                  return const EmptyState(
                    icon: Icons.shopping_bag_outlined,
                    title: 'Your bag is empty',
                    message: 'Browse the catalogue and add medicine to your bag to see it here.',
                  );
                }
                return _CartContent(
                  cart: cart,
                  couponController: _couponController,
                  applyingCoupon: _applyingCoupon,
                  onQuantityChanged: _changeQuantity,
                  onApplyCoupon: _applyCoupon,
                );
              },
            ),
    );
  }
}

class _CartContent extends StatelessWidget {
  final CartSummary cart;
  final TextEditingController couponController;
  final bool applyingCoupon;
  final void Function(String productId, int quantity) onQuantityChanged;
  final VoidCallback onApplyCoupon;

  const _CartContent({
    required this.cart,
    required this.couponController,
    required this.applyingCoupon,
    required this.onQuantityChanged,
    required this.onApplyCoupon,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            children: [
              if (cart.hasUnavailableItem)
                Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.accent50, borderRadius: BorderRadius.circular(12)),
                  child: const Text(
                    'Some items in your bag are no longer available in the requested quantity.',
                    style: TextStyle(fontSize: 12.5, color: AppColors.accent700),
                  ),
                ),
              Text('${cart.itemCount} items', style: const TextStyle(fontSize: 13, color: AppColors.slate500, fontWeight: FontWeight.w600)),
              const SizedBox(height: 10),
              ...cart.items.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _CartItemTile(
                    item: item,
                    onQuantityChanged: (q) => onQuantityChanged(item.productId, q),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: couponController,
                      textCapitalization: TextCapitalization.characters,
                      decoration: const InputDecoration(hintText: 'Coupon code'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  SizedBox(
                    width: 96,
                    child: AppButton(
                      label: 'Apply',
                      loading: applyingCoupon,
                      onPressed: onApplyCoupon,
                      height: 48,
                      variant: AppButtonVariant.outline,
                    ),
                  ),
                ],
              ),
              if (cart.couponError != null) ...[
                const SizedBox(height: 6),
                Text(cart.couponError!, style: const TextStyle(color: AppColors.red600, fontSize: 12)),
              ],
            ],
          ),
        ),
        _CartSummaryBar(cart: cart),
      ],
    );
  }
}

class _CartItemTile extends StatelessWidget {
  final CartItem item;
  final ValueChanged<int> onQuantityChanged;

  const _CartItemTile({required this.item, required this.onQuantityChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            height: 72,
            width: 72,
            child: ProductImage(imageUrl: item.image, seed: item.name, iconSize: 24, borderRadius: BorderRadius.circular(12)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                if (item.prescriptionRequired) ...[
                  const SizedBox(height: 3),
                  const Text('Requires prescription', style: TextStyle(fontSize: 11, color: AppColors.amber600, fontWeight: FontWeight.w600)),
                ],
                if (!item.available) ...[
                  const SizedBox(height: 3),
                  Text('Only ${item.stockQuantity} left in stock', style: const TextStyle(fontSize: 11, color: AppColors.red600)),
                ],
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    QuantityStepper(quantity: item.quantity, onChanged: onQuantityChanged),
                    Text(formatBDT(item.lineTotal), style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.brand700, fontSize: 14)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CartSummaryBar extends StatelessWidget {
  final CartSummary cart;

  const _CartSummaryBar({required this.cart});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
          boxShadow: [BoxShadow(color: AppColors.slate900.withValues(alpha: 0.08), blurRadius: 24, offset: const Offset(0, -8))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _SummaryRow(label: 'Subtotal', value: formatBDT(cart.subtotal)),
            if (cart.couponDiscount > 0) _SummaryRow(label: 'Coupon discount', value: '-${formatBDT(cart.couponDiscount)}', valueColor: AppColors.emerald600),
            _SummaryRow(label: 'Delivery', value: cart.deliveryCharge == 0 ? 'Free' : formatBDT(cart.deliveryCharge)),
            const Divider(height: 20),
            _SummaryRow(label: 'Total', value: formatBDT(cart.total), bold: true),
            const SizedBox(height: 14),
            AppButton(
              label: 'Proceed to checkout',
              onPressed: cart.hasUnavailableItem
                  ? null
                  : () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CheckoutScreen())),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool bold;

  const _SummaryRow({required this.label, required this.value, this.valueColor, this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: bold ? 15 : 13, color: AppColors.slate500, fontWeight: bold ? FontWeight.w700 : FontWeight.w500)),
          Text(
            value,
            style: TextStyle(
              fontSize: bold ? 18 : 13.5,
              fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
              color: valueColor ?? (bold ? AppColors.brand700 : AppColors.slate800),
            ),
          ),
        ],
      ),
    );
  }
}
