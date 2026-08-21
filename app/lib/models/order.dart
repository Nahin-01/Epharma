import 'address.dart';
import 'json_helpers.dart';

class OrderItem {
  final String productId;
  final String name;
  final int quantity;
  final double price;
  final double? mrp;
  final double subtotal;
  final bool prescriptionRequired;

  OrderItem({
    required this.productId,
    required this.name,
    required this.quantity,
    required this.price,
    this.mrp,
    required this.subtotal,
    this.prescriptionRequired = false,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: asRefId(json['product']),
      name: asString(json['name']),
      quantity: asInt(json['quantity'], 1),
      price: asDouble(json['price']),
      mrp: json['mrp'] == null ? null : asDouble(json['mrp']),
      subtotal: asDouble(json['subtotal']),
      prescriptionRequired: asBool(json['prescriptionRequired']),
    );
  }
}

class OrderStatusEvent {
  final String status;
  final DateTime? at;
  final String? note;

  OrderStatusEvent({required this.status, this.at, this.note});

  factory OrderStatusEvent.fromJson(Map<String, dynamic> json) {
    return OrderStatusEvent(
      status: asString(json['status']),
      at: asDateOrNull(json['at']),
      note: asStringOrNull(json['note']),
    );
  }
}

class Order {
  final String id;
  final String orderNumber;
  final List<OrderItem> items;
  final Address address;
  final String deliveryType;
  final double deliveryCharge;
  final String? couponCode;
  final double couponDiscount;
  final double subtotal;
  final double discountAmount;
  final double total;
  final String? notes;
  final String paymentMethod;
  final String paymentStatus;
  final String status;
  final List<OrderStatusEvent> statusHistory;
  final DateTime? placedAt;
  final DateTime? createdAt;

  Order({
    required this.id,
    required this.orderNumber,
    this.items = const [],
    required this.address,
    this.deliveryType = 'STANDARD',
    this.deliveryCharge = 0,
    this.couponCode,
    this.couponDiscount = 0,
    required this.subtotal,
    this.discountAmount = 0,
    required this.total,
    this.notes,
    this.paymentMethod = 'COD',
    this.paymentStatus = 'PENDING',
    required this.status,
    this.statusHistory = const [],
    this.placedAt,
    this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    final coupon = json['coupon'] as Map<String, dynamic>?;
    return Order(
      id: asString(json['_id'] ?? json['id']),
      orderNumber: asString(json['orderNumber']),
      items: asList<OrderItem>(json['items'], (item) => OrderItem.fromJson(item as Map<String, dynamic>)),
      address: Address.fromJson((json['address'] as Map<String, dynamic>?) ?? const {}),
      deliveryType: asString(json['deliveryType'], 'STANDARD'),
      deliveryCharge: asDouble(json['deliveryCharge']),
      couponCode: asStringOrNull(coupon?['code']),
      couponDiscount: asDouble(coupon?['discountAmount']),
      subtotal: asDouble(json['subtotal']),
      discountAmount: asDouble(json['discountAmount']),
      total: asDouble(json['total']),
      notes: asStringOrNull(json['notes']),
      paymentMethod: asString(json['paymentMethod'], 'COD'),
      paymentStatus: asString(json['paymentStatus'], 'PENDING'),
      status: asString(json['status'], 'PENDING'),
      statusHistory: asList<OrderStatusEvent>(
        json['statusHistory'],
        (item) => OrderStatusEvent.fromJson(item as Map<String, dynamic>),
      ),
      placedAt: asDateOrNull(json['placedAt']),
      createdAt: asDateOrNull(json['createdAt']),
    );
  }
}
