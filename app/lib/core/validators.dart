/// Mirrors the backend's Joi patterns (backend/src/modules/auth/auth.validation.js)
/// so malformed input gets a clear message here instead of a generic
/// "Validation failed" bounce from the server.
final _phonePattern = RegExp(r'^\+?[0-9]{10,15}$');
final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

bool isValidPhone(String value) => _phonePattern.hasMatch(value.trim());

bool isValidEmail(String value) => _emailPattern.hasMatch(value.trim());
