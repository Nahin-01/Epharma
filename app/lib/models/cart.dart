import 'json_helpers.dart';

class CartItem {
  final String productId;
  final String name;
  final String? image;
  final double price;
  final int quantity;
  final double lineTotal;
  final bool prescriptionRequired;
  final bool available;
  final int stockQuantity;

  CartItem({
    required this.productId,
    required this.name,
    this.image,
    required this.price,
    required this.quantity,
    required this.lineTotal,
    this.prescriptionRequired = false,
    this.available = true,
    this.stockQuantity = 0,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      productId: asRefId(json['product']),
      name: asString(json['name']),
      image: asStringOrNull(json['image']),
      price: asDouble(json['price']),
      quantity: asInt(json['quantity'], 1),
      lineTotal: asDouble(json['lineTotal']),
      prescriptionRequired: asBool(json['prescriptionRequired']),
      available: json['available'] == null ? true : asBool(json['available'], true),
      stockQuantity: asInt(json['stockQuantity']),
    );
  }
}

class CartSummary {
  final String? cartId;
  final List<CartItem> items;
  final int itemCount;
  final double subtotal;
  final String? couponCode;
  final double couponDiscount;
  final String? couponError;
  final double deliveryCharge;
  final double total;
  final bool requiresPrescription;
  final bool hasUnavailableItem;
  final String notes;

  CartSummary({
    this.cartId,
    this.items = const [],
    this.itemCount = 0,
    this.subtotal = 0,
    this.couponCode,
    this.couponDiscount = 0,
    this.couponError,
    this.deliveryCharge = 0,
    this.total = 0,
    this.requiresPrescription = false,
    this.hasUnavailableItem = false,
    this.notes = '',
  });

  factory CartSummary.empty() => CartSummary();

  factory CartSummary.fromJson(Map<String, dynamic> json) {
    return CartSummary(
      cartId: asStringOrNull(json['cartId'] ?? json['_id']),
      items: asList<CartItem>(json['items'], (item) => CartItem.fromJson(item as Map<String, dynamic>)),
      itemCount: asInt(json['itemCount']),
      subtotal: asDouble(json['subtotal']),
      couponCode: asStringOrNull(json['couponCode']),
      couponDiscount: asDouble(json['couponDiscount']),
      couponError: asStringOrNull(json['couponError']),
      deliveryCharge: asDouble(json['deliveryCharge']),
      total: asDouble(json['total']),
      requiresPrescription: asBool(json['requiresPrescription']),
      hasUnavailableItem: asBool(json['hasUnavailableItem']),
      notes: asString(json['notes']),
    );
  }

  bool get isEmpty => items.isEmpty;
}
