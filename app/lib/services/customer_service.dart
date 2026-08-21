import '../models/address.dart';
import '../network/api_client.dart';

class CustomerService {
  final _client = ApiClient.instance;

  Future<List<Address>> listAddresses() {
    return _client.unwrap(
      (dio) => dio.get('/customers/me/addresses'),
      (data) => (data as List<dynamic>).map((e) => Address.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }

  Future<Address> addAddress(Address address) {
    return _client.unwrap(
      (dio) => dio.post('/customers/me/addresses', data: address.toJson()),
      (data) => Address.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<Address> updateAddress(String addressId, Address address) {
    return _client.unwrap(
      (dio) => dio.patch('/customers/me/addresses/$addressId', data: address.toJson()),
      (data) => Address.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<void> deleteAddress(String addressId) {
    return _client.unwrap((dio) => dio.delete('/customers/me/addresses/$addressId'), (_) {});
  }
}
