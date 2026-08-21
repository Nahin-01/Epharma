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

  Future<CartSummary> updateItem(String productId, int quantity) async {
    _cart = await _cartService.updateItem(productId, quantity);
    notifyListeners();
    return _cart;
  }

  Future<CartSummary> removeItem(String productId) async {
    _cart = await _cartService.removeItem(productId);
    notifyListeners();
    return _cart;
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
