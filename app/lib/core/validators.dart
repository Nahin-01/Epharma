/// Mirrors the backend's Joi patterns (backend/src/modules/auth/auth.validation.js)
/// so malformed input gets a clear message here instead of a generic
/// "Validation failed" bounce from the server.
final _phonePattern = RegExp(r'^\+?[0-9]{10,15}$');
final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

bool isValidPhone(String value) => _phonePattern.hasMatch(value.trim());

bool isValidEmail(String value) => _emailPattern.hasMatch(value.trim());

/// Supabase's phone auth (and the backend's OTP/reset flows) both need one
/// consistent E.164 string per user - without this, a Bangladeshi number
/// typed the natural local way ("01712345678") fails Supabase's phone
/// validation outright, and even when it doesn't, a mismatched format would
/// silently look up as a different user than the one who registered.
/// Mirrors backend/src/integrations/sms/sms.provider.js's toE164.
String normalizePhone(String value) {
  final digits = value.trim().replaceAll(RegExp(r'[^0-9+]'), '');
  if (digits.isEmpty) return digits;
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('880')) return '+$digits';
  if (digits.startsWith('0')) return '+880${digits.substring(1)}';
  return '+880$digits';
}
