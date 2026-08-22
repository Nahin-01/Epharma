import 'json_helpers.dart';

class Payment {
  final String id;
  final String transactionId;
  final String method;
  final String status;
  final String? redirectUrl;

  Payment({
    required this.id,
    required this.transactionId,
    required this.method,
    required this.status,
    this.redirectUrl,
  });

  factory Payment.fromJson(Map<String, dynamic> json) {
    final gatewayResponse = json['gatewayResponse'];
    final redirectUrl = gatewayResponse is Map ? gatewayResponse['redirectUrl'] as String? : null;
    return Payment(
      id: asRefId(json['_id']),
      transactionId: asString(json['transactionId']),
      method: asString(json['method']),
      status: asString(json['status']),
      redirectUrl: redirectUrl,
    );
  }
}
