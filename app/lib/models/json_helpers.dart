/// Small set of forgiving JSON accessors. The backend mostly returns clean
/// types, but numbers can arrive as int or double depending on the field,
/// and Mongo ids need normalizing to a plain string — these helpers avoid
/// scattering `as` casts (and crashes) throughout every model.
String asString(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  if (value is String) return value;
  return value.toString();
}

String? asStringOrNull(dynamic value) {
  if (value == null) return null;
  if (value is String) return value.isEmpty ? null : value;
  return value.toString();
}

double asDouble(dynamic value, [double fallback = 0]) {
  if (value == null) return fallback;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

int asInt(dynamic value, [int fallback = 0]) {
  if (value == null) return fallback;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

bool asBool(dynamic value, [bool fallback = false]) {
  if (value == null) return fallback;
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true';
  return fallback;
}

List<T> asList<T>(dynamic value, T Function(dynamic item) mapper) {
  if (value == null || value is! List) return <T>[];
  return value.map(mapper).toList();
}

DateTime? asDateOrNull(dynamic value) {
  if (value == null) return null;
  if (value is String && value.isEmpty) return null;
  try {
    return DateTime.parse(value.toString()).toLocal();
  } catch (_) {
    return null;
  }
}

/// Many backend refs are either a plain Mongo id string (not populated) or
/// a populated sub-document `{ _id, ... }`. This extracts the id either way.
String asRefId(dynamic value) {
  if (value == null) return '';
  if (value is String) return value;
  if (value is Map<String, dynamic>) return asString(value['_id']);
  return value.toString();
}
