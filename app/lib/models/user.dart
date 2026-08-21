import 'json_helpers.dart';

class AppUser {
  final String id;
  final String? name;
  final String? email;
  final String? phone;
  final String role;
  final bool isEmailVerified;
  final bool isPhoneVerified;

  AppUser({
    required this.id,
    this.name,
    this.email,
    this.phone,
    required this.role,
    this.isEmailVerified = false,
    this.isPhoneVerified = false,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: asString(json['_id'] ?? json['id']),
      name: asStringOrNull(json['name']),
      email: asStringOrNull(json['email']),
      phone: asStringOrNull(json['phone']),
      role: asString(json['role'], 'CUSTOMER'),
      isEmailVerified: asBool(json['isEmailVerified']),
      isPhoneVerified: asBool(json['isPhoneVerified']),
    );
  }

  String get displayName {
    if (name != null && name!.trim().isNotEmpty) return name!.trim();
    if (email != null) return email!;
    if (phone != null) return phone!;
    return 'there';
  }

  String get initials {
    final n = displayName.trim();
    if (n.isEmpty) return '?';
    final parts = n.split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts.last.substring(0, 1)).toUpperCase();
  }
}
