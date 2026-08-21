import '../models/cart.dart';
import '../network/api_client.dart';

class CartService {
  final _client = ApiClient.instance;

  Future<CartSummary> get() {
    return _client.unwrap((dio) => dio.get('/cart'), (data) => CartSummary.fromJson(data as Map<String, dynamic>));
  }

  Future<CartSummary> addItem(String productId, {int quantity = 1}) {
    return _client.unwrap(
      (dio) => dio.post('/cart/items', data: {'product': productId, 'quantity': quantity}),
      (data) => CartSummary.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<CartSummary> updateItem(String productId, int quantity) {
    return _client.unwrap(
      (dio) => dio.patch('/cart/items/$productId', data: {'quantity': quantity}),
      (data) => CartSummary.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<CartSummary> removeItem(String productId) {
    return _client.unwrap(
      (dio) => dio.delete('/cart/items/$productId'),
      (data) => CartSummary.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<CartSummary> clear() {
    return _client.unwrap((dio) => dio.delete('/cart'), (data) => CartSummary.fromJson(data as Map<String, dynamic>));
  }

  Future<CartSummary> applyCoupon(String code) {
    return _client.unwrap(
      (dio) => dio.post('/cart/coupon', data: {'code': code}),
      (data) => CartSummary.fromJson(data as Map<String, dynamic>),
    );
  }
}
