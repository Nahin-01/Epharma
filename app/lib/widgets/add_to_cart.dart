import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/product.dart';
import '../network/api_exception.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../screens/auth/login_screen.dart';

/// Shared "+ Add to bag" behavior for any product card (home rails, shop
/// grid, etc.) - mirrors ProductDetailScreen's _addToCart so every entry
/// point behaves the same: prompt sign-in if needed, add one unit, and
/// surface success/failure as a snackbar.
Future<void> addToCartFlow(BuildContext context, Product product) async {
  final auth = context.read<AuthProvider>();
  if (!auth.isAuthenticated) {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
    return;
  }
  try {
    await context.read<CartProvider>().addItem(product.id, quantity: 1);
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${product.name} added to your bag')));
    }
  } on ApiException catch (e) {
    if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not add to bag. Please try again.')));
    }
  }
}
