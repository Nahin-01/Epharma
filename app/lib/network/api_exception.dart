/// Normalized error thrown by every service call so screens can show a
/// single friendly message regardless of what went wrong underneath
/// (validation error, network failure, session expiry, etc.).
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  /// Per-field validation details, when the backend sent any — always a
  /// list of `{field, message}` objects (see validation.middleware.js),
  /// never a map.
  final List<dynamic>? errors;

  ApiException(this.message, {this.statusCode, this.errors});

  @override
  String toString() => message;
}
