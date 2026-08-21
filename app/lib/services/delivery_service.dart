import '../models/json_helpers.dart';
import '../network/api_client.dart';

class DeliveryService {
  final _client = ApiClient.instance;

  Future<double> resolveCharge({required String district, String? area}) {
    return _client.unwrap(
      (dio) => dio.get('/delivery/zones/charge', queryParameters: {
        'district': district,
        if (area != null && area.isNotEmpty) 'area': area,
      }),
      (data) {
        if (data is Map<String, dynamic>) {
          return asDouble(data['charge']);
        }
        return asDouble(data);
      },
    );
  }
}

class CouponService {
  final _client = ApiClient.instance;

  Future<Map<String, dynamic>> preview(String code, double subtotal) {
    return _client.unwrap(
      (dio) => dio.post('/coupons/preview', data: {'code': code, 'subtotal': subtotal}),
      (data) => data as Map<String, dynamic>,
    );
  }
}
