/// Normalized error thrown by every service call so screens can show a
/// single friendly message regardless of what went wrong underneath
/// (validation error, network failure, session expiry, etc.).
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? errors;

  ApiException(this.message, {this.statusCode, this.errors});

  @override
  String toString() => message;
}
