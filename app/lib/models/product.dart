import 'json_helpers.dart';

class Product {
  final String id;
  final String name;
  final String? bnName;
  final String slug;
  final String sku;
  final String? genericName;
  final String categoryId;
  final String dosageForm;
  final String? strength;
  final String? manufacturer;
  final bool prescriptionRequired;
  final String? description;
  final List<String> images;
  final double mrp;
  final double sellingPrice;
  final double discountPercent;
  final int stockQuantity;
  final bool isFeatured;
  final bool isBestSeller;
  final String status;
  final int soldCount;

  Product({
    required this.id,
    required this.name,
    this.bnName,
    required this.slug,
    required this.sku,
    this.genericName,
    required this.categoryId,
    required this.dosageForm,
    this.strength,
    this.manufacturer,
    this.prescriptionRequired = false,
    this.description,
    this.images = const [],
    required this.mrp,
    required this.sellingPrice,
    this.discountPercent = 0,
    this.stockQuantity = 0,
    this.isFeatured = false,
    this.isBestSeller = false,
    this.status = 'ACTIVE',
    this.soldCount = 0,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: asString(json['_id'] ?? json['id']),
      name: asString(json['name']),
      bnName: asStringOrNull(json['bnName']),
      slug: asString(json['slug']),
      sku: asString(json['sku']),
      genericName: asStringOrNull(json['genericName']),
      categoryId: asRefId(json['category']),
      dosageForm: asString(json['dosageForm'], 'OTHER'),
      strength: asStringOrNull(json['strength']),
      manufacturer: asStringOrNull(json['manufacturer']),
      prescriptionRequired: asBool(json['prescriptionRequired']),
      description: asStringOrNull(json['description']),
      images: asList<String>(json['images'], (item) => item.toString()),
      mrp: asDouble(json['mrp']),
      sellingPrice: asDouble(json['sellingPrice']),
      discountPercent: asDouble(json['discountPercent']),
      stockQuantity: asInt(json['stockQuantity']),
      isFeatured: asBool(json['isFeatured']),
      isBestSeller: asBool(json['isBestSeller']),
      status: asString(json['status'], 'ACTIVE'),
      soldCount: asInt(json['soldCount']),
    );
  }

  bool get inStock => stockQuantity > 0;

  double get discountAmount {
    final diff = mrp - sellingPrice;
    return diff < 0 ? 0 : diff;
  }

  int get computedDiscountPercent {
    if (mrp <= 0) return 0;
    final pct = (((mrp - sellingPrice) / mrp) * 100).round();
    if (pct < 0) return 0;
    if (pct > 100) return 100;
    return pct;
  }

  String? get primaryImage => images.isNotEmpty ? images.first : null;
}
