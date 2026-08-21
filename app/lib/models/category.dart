import 'json_helpers.dart';

class Category {
  final String id;
  final String name;
  final String? bnName;
  final String slug;
  final String? icon;
  final String? image;
  final String? parentId;
  final bool isActive;
  final List<Category> children;

  Category({
    required this.id,
    required this.name,
    this.bnName,
    required this.slug,
    this.icon,
    this.image,
    this.parentId,
    this.isActive = true,
    this.children = const [],
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: asString(json['_id'] ?? json['id']),
      name: asString(json['name']),
      bnName: asStringOrNull(json['bnName']),
      slug: asString(json['slug']),
      icon: asStringOrNull(json['icon']),
      image: asStringOrNull(json['image']),
      parentId: asStringOrNull(json['parent']),
      isActive: asBool(json['isActive'], true),
      children: asList<Category>(json['children'], (item) => Category.fromJson(item as Map<String, dynamic>)),
    );
  }
}
