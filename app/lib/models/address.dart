import 'json_helpers.dart';

class Address {
  final String? id;
  final String name;
  final String phone;
  final String line1;
  final String? line2;
  final String district;
  final String? area;
  final String? thana;
  final String? postCode;
  final bool isDefault;

  Address({
    this.id,
    required this.name,
    required this.phone,
    required this.line1,
    this.line2,
    required this.district,
    this.area,
    this.thana,
    this.postCode,
    this.isDefault = false,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: asStringOrNull(json['_id'] ?? json['id']),
      name: asString(json['name']),
      phone: asString(json['phone']),
      line1: asString(json['line1']),
      line2: asStringOrNull(json['line2']),
      district: asString(json['district']),
      area: asStringOrNull(json['area']),
      thana: asStringOrNull(json['thana']),
      postCode: asStringOrNull(json['postCode']),
      isDefault: asBool(json['isDefault']),
    );
  }

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'line1': line1,
        if (line2 != null) 'line2': line2,
        'district': district,
        if (area != null) 'area': area,
        if (thana != null) 'thana': thana,
        if (postCode != null) 'postCode': postCode,
      };

  String get shortLine {
    final parts = [line1, if (area != null && area!.isNotEmpty) area, district].where((p) => p != null && p.isNotEmpty);
    return parts.join(', ');
  }
}
