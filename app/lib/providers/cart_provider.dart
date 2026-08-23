import 'package:flutter/foundation.dart';

import '../models/cart.dart';
import '../services/cart_service.dart';
import 'auth_provider.dart';

/// Cart data always comes live from the backend — nothing about products,
/// prices, or totals is hardcoded on the client. This provider just caches
/// the last-fetched summary so the badge/cart screen stay in sync.
class CartProvider extends ChangeNotifier {
  final _cartService = CartService();

  CartSummary _cart = CartSummary.empty();
  bool _loading = false;
  bool _initialized = false;
  bool _isAuthenticated = false;

  CartSummary get cart => _cart;
  bool get loading => _loading;
  bool get initialized => _initialized;

  /// Called by the top-level MultiProvider setup whenever AuthProvider's
  /// state changes, so the cart clears on logout and reloads on login.
  void onAuthChanged(AuthProvider auth) {
    final nowAuthenticated = auth.isAuthenticated;
    if (auth.isLoading) return;
    if (nowAuthenticated == _isAuthenticated && _initialized) return;
    _isAuthenticated = nowAuthenticated;
    if (!nowAuthenticated) {
      _cart = CartSummary.empty();
      _initialized = true;
      notifyListeners();
      return;
    }
    refresh();
  }

  Future<CartSummary> refresh() async {
    if (!_isAuthenticated) {
      _cart = CartSummary.empty();
      _initialized = true;
      notifyListeners();
      return _cart;
    }
    _loading = true;
    notifyListeners();
    try {
      _cart = await _cartService.get();
      return _cart;
    } finally {
      _loading = false;
      _initialized = true;
      notifyListeners();
    }
  }

  Future<CartSummary> addItem(String productId, {int quantity = 1}) async {
    _cart = await _cartService.addItem(productId, quantity: quantity);
    notifyListeners();
    return _cart;
  }

  /// Recomputes subtotal/itemCount/total from [items] using the coupon
  /// discount and delivery charge already in [current] - an approximation
  /// good enough to paint instantly; the next server response overwrites it
  /// with the authoritative figures.
  CartSummary _recompute(CartSummary current, List<CartItem> items) {
    final subtotal = items.fold(0.0, (sum, i) => sum + i.lineTotal);
    final itemCount = items.fold(0, (sum, i) => sum + i.quantity);
    final total = (subtotal - current.couponDiscount + current.deliveryCharge).clamp(0, double.infinity).toDouble();
    return CartSummary(
      cartId: current.cartId,
      items: items,
      itemCount: itemCount,
      subtotal: subtotal,
      couponCode: current.couponCode,
      couponDiscount: current.couponDiscount,
      couponError: current.couponError,
      deliveryCharge: current.deliveryCharge,
      total: total,
      requiresPrescription: items.any((i) => i.prescriptionRequired),
      hasUnavailableItem: items.any((i) => !i.available),
      notes: current.notes,
    );
  }

  /// Updates the screen immediately from data already on hand (no waiting on
  /// a round trip to feel the tap register), then reconciles with the
  /// server's authoritative summary - or rolls back on failure.
  Future<CartSummary> updateItem(String productId, int quantity) async {
    final previous = _cart;
    final items = _cart.items
        .map((i) => i.productId == productId
            ? CartItem(
                productId: i.productId,
                name: i.name,
                image: i.image,
                price: i.price,
                quantity: quantity,
                lineTotal: i.price * quantity,
                prescriptionRequired: i.prescriptionRequired,
                available: i.available,
                stockQuantity: i.stockQuantity,
              )
            : i)
        .toList();
    _cart = _recompute(_cart, items);
    notifyListeners();
    try {
      _cart = await _cartService.updateItem(productId, quantity);
      notifyListeners();
      return _cart;
    } catch (err) {
      _cart = previous;
      notifyListeners();
      rethrow;
    }
  }

  Future<CartSummary> removeItem(String productId) async {
    final previous = _cart;
    final items = _cart.items.where((i) => i.productId != productId).toList();
    _cart = _recompute(_cart, items);
    notifyListeners();
    try {
      _cart = await _cartService.removeItem(productId);
      notifyListeners();
      return _cart;
    } catch (err) {
      _cart = previous;
      notifyListeners();
      rethrow;
    }
  }

  Future<CartSummary> clear() async {
    _cart = await _cartService.clear();
    notifyListeners();
    return _cart;
  }

  Future<CartSummary> applyCoupon(String code) async {
    _cart = await _cartService.applyCoupon(code);
    notifyListeners();
    return _cart;
  }
}
