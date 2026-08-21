import 'json_helpers.dart';

class MatchedMedicine {
  final String text;
  final String? productName;
  final String? productId;
  final double confidence;

  MatchedMedicine({
    required this.text,
    this.productName,
    this.productId,
    this.confidence = 0,
  });

  factory MatchedMedicine.fromJson(Map<String, dynamic> json) {
    return MatchedMedicine(
      text: asString(json['text']),
      productName: asStringOrNull(json['productName']),
      productId: asStringOrNull(json['product']),
      confidence: asDouble(json['confidence']),
    );
  }
}

class OcrResult {
  final String? provider;
  final String? rawText;
  final double overallConfidence;
  final List<MatchedMedicine> matchedMedicines;
  final DateTime? processedAt;

  OcrResult({
    this.provider,
    this.rawText,
    this.overallConfidence = 0,
    this.matchedMedicines = const [],
    this.processedAt,
  });

  factory OcrResult.fromJson(Map<String, dynamic> json) {
    return OcrResult(
      provider: asStringOrNull(json['provider']),
      rawText: asStringOrNull(json['rawText']),
      overallConfidence: asDouble(json['overallConfidence']),
      matchedMedicines: asList<MatchedMedicine>(
        json['matchedMedicines'],
        (item) => MatchedMedicine.fromJson(item as Map<String, dynamic>),
      ),
      processedAt: asDateOrNull(json['processedAt']),
    );
  }
}

class PrescriptionFile {
  final String? id;
  final String storageKey;
  final String? originalName;
  final String? mimeType;
  final int size;
  final DateTime? uploadedAt;
  final OcrResult? ocrResult;

  PrescriptionFile({
    this.id,
    required this.storageKey,
    this.originalName,
    this.mimeType,
    this.size = 0,
    this.uploadedAt,
    this.ocrResult,
  });

  factory PrescriptionFile.fromJson(Map<String, dynamic> json) {
    return PrescriptionFile(
      id: asStringOrNull(json['_id']),
      storageKey: asString(json['storageKey']),
      originalName: asStringOrNull(json['originalName']),
      mimeType: asStringOrNull(json['mimeType']),
      size: asInt(json['size']),
      uploadedAt: asDateOrNull(json['uploadedAt']),
      ocrResult: json['ocrResult'] is Map<String, dynamic>
          ? OcrResult.fromJson(json['ocrResult'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ClarificationEntry {
  final String note;
  final DateTime? at;

  ClarificationEntry({required this.note, this.at});

  factory ClarificationEntry.fromJson(Map<String, dynamic> json) {
    return ClarificationEntry(note: asString(json['note']), at: asDateOrNull(json['at']));
  }
}

class Prescription {
  final String id;
  final List<PrescriptionFile> files;
  final String source;
  final String status;
  final String? reviewerNotes;
  final DateTime? reviewedAt;
  final DateTime? createdAt;
  final List<ClarificationEntry> clarificationHistory;

  Prescription({
    required this.id,
    this.files = const [],
    this.source = 'UPLOAD',
    required this.status,
    this.reviewerNotes,
    this.reviewedAt,
    this.createdAt,
    this.clarificationHistory = const [],
  });

  /// Every detected medicine line across all files on this prescription, in
  /// upload order — this is what a customer actually cares about seeing,
  /// regardless of which photo a given line came from.
  List<MatchedMedicine> get matchedMedicines =>
      files.expand((f) => f.ocrResult?.matchedMedicines ?? const <MatchedMedicine>[]).toList();

  /// True while at least one uploaded file hasn't come back from OCR yet.
  bool get stillAnalyzing => files.isNotEmpty && files.any((f) => f.ocrResult == null);

  factory Prescription.fromJson(Map<String, dynamic> json) {
    return Prescription(
      id: asString(json['_id'] ?? json['id']),
      files: asList<PrescriptionFile>(
        json['files'],
        (item) => PrescriptionFile.fromJson(item as Map<String, dynamic>),
      ),
      source: asString(json['source'], 'UPLOAD'),
      status: asString(json['status'], 'UPLOADED'),
      reviewerNotes: asStringOrNull(json['reviewerNotes']),
      reviewedAt: asDateOrNull(json['reviewedAt']),
      createdAt: asDateOrNull(json['createdAt']),
      clarificationHistory: asList<ClarificationEntry>(
        json['clarificationHistory'],
        (item) => ClarificationEntry.fromJson(item as Map<String, dynamic>),
      ),
    );
  }
}
