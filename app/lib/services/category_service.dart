import '../models/category.dart';
import '../network/api_client.dart';

class CategoryService {
  final _client = ApiClient.instance;

  Future<List<Category>> tree({bool activeOnly = true}) {
    return _client.unwrap(
      (dio) => dio.get('/categories/tree', queryParameters: {'activeOnly': activeOnly}),
      (data) => (data as List<dynamic>).map((e) => Category.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Future<Category> getById(String id) {
    return _client.unwrap(
      (dio) => dio.get('/categories/$id'),
      (data) => Category.fromJson(data as Map<String, dynamic>),
    );
  }
}
