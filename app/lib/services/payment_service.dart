import '../models/payment.dart';
import '../network/api_client.dart';

class PaymentService {
  final _client = ApiClient.instance;

  Future<Payment> getByOrder(String orderId) {
    return _client.unwrap(
      (dio) => dio.get('/payments/order/$orderId'),
      (data) => Payment.fromJson(data as Map<String, dynamic>),
    );
  }

  /// Hits the same dev-only "mock gateway" completion endpoint the web app
  /// uses (see backend/src/modules/payments/payment.routes.js) so a demo
  /// checkout with a non-COD method can actually reach PAID in-app instead
  /// of being stuck at PROCESSING forever.
  Future<Payment> completeMock(String transactionId) {
    return _client.unwrap(
      (dio) => dio.get('/payments/mock/$transactionId/complete'),
      (data) => Payment.fromJson(data as Map<String, dynamic>),
    );
  }
}
