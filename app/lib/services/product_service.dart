import '../models/json_helpers.dart';
import '../models/product.dart';
import '../network/api_client.dart';

class ProductPage {
  final List<Product> items;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  ProductPage({
    required this.items,
    this.page = 1,
    this.limit = 20,
    this.total = 0,
    this.totalPages = 1,
  });

  bool get hasMore => page < totalPages;
}

class ProductService {
  final _client = ApiClient.instance;

  Future<ProductPage> list({
    int page = 1,
    int limit = 20,
    String? search,
    String? category,
    bool? isFeatured,
    bool? isBestSeller,
    String? sort,
  }) {
    return _client.unwrapWithMeta(
      (dio) => dio.get('/products', queryParameters: {
        'page': page,
        'limit': limit,
        if (search != null && search.isNotEmpty) 'search': search,
        if (category != null && category.isNotEmpty) 'category': category,
        if (isFeatured == true) 'isFeatured': true,
        if (isBestSeller == true) 'isBestSeller': true,
        if (sort != null && sort.isNotEmpty) 'sort': sort,
      }),
      (data, meta) {
        final items = (data as List<dynamic>? ?? const [])
            .map((e) => Product.fromJson(e as Map<String, dynamic>))
            .toList();
        return ProductPage(
          items: items,
          page: meta != null ? asInt(meta['page'], page) : page,
          limit: meta != null ? asInt(meta['limit'], limit) : limit,
          total: meta != null ? asInt(meta['total'], items.length) : items.length,
          totalPages: meta != null ? asInt(meta['totalPages'], 1) : 1,
        );
      },
    );
  }

  Future<Product> getBySlug(String slug) {
    return _client.unwrap(
      (dio) => dio.get('/products/slug/$slug'),
      (data) => Product.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<Product> getById(String id) {
    return _client.unwrap(
      (dio) => dio.get('/products/$id'),
      (data) => Product.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<Product>> getRelated(String id, {int limit = 8}) {
    return _client.unwrap(
      (dio) => dio.get('/products/$id/related', queryParameters: {'limit': limit}),
      (data) => (data as List<dynamic>).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}
