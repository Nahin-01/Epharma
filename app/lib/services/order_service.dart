import '../models/address.dart';
import '../models/json_helpers.dart';
import '../models/order.dart';
import '../network/api_client.dart';

class OrderPage {
  final List<Order> items;
  final int page;
  final int totalPages;

  OrderPage({required this.items, this.page = 1, this.totalPages = 1});
}

class CheckoutPayload {
  final String? addressId;
  final Address? address;
  final String deliveryType;
  final String? notes;
  final String? couponCode;
  final String? prescriptionId;
  final String paymentMethod;

  CheckoutPayload({
    this.addressId,
    this.address,
    this.deliveryType = 'STANDARD',
    this.notes,
    this.couponCode,
    this.prescriptionId,
    required this.paymentMethod,
  });

  Map<String, dynamic> toJson() => {
        if (addressId != null) 'addressId': addressId,
        if (address != null) 'address': address!.toJson(),
        'deliveryType': deliveryType,
        if (notes != null) 'notes': notes,
        if (couponCode != null && couponCode!.isNotEmpty) 'couponCode': couponCode,
        if (prescriptionId != null) 'prescriptionId': prescriptionId,
        'paymentMethod': paymentMethod,
      };
}

class OrderService {
  final _client = ApiClient.instance;

  Future<Order> checkout(CheckoutPayload payload) {
    return _client.unwrap(
      (dio) => dio.post('/orders/checkout', data: payload.toJson()),
      (data) => Order.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<OrderPage> listMine({int page = 1, int limit = 10}) {
    return _client.unwrapWithMeta(
      (dio) => dio.get('/orders/mine', queryParameters: {'page': page, 'limit': limit}),
      (data, meta) {
        final items = (data as List<dynamic>? ?? const [])
            .map((e) => Order.fromJson(e as Map<String, dynamic>))
            .toList();
        return OrderPage(
          items: items,
          page: meta != null ? asInt(meta['page'], page) : page,
          totalPages: meta != null ? asInt(meta['totalPages'], 1) : 1,
        );
      },
    );
  }

  Future<Order> getById(String id) {
    return _client.unwrap((dio) => dio.get('/orders/$id'), (data) => Order.fromJson(data as Map<String, dynamic>));
  }

  Future<Order> cancel(String id, {String reason = ''}) {
    return _client.unwrap(
      (dio) => dio.post('/orders/$id/cancel', data: {'reason': reason}),
      (data) => Order.fromJson(data as Map<String, dynamic>),
    );
  }
}
