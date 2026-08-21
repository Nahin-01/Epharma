import 'package:dio/dio.dart';

import '../models/json_helpers.dart';
import '../models/prescription.dart';
import '../network/api_client.dart';

class PrescriptionPage {
  final List<Prescription> items;
  final int page;
  final int totalPages;

  PrescriptionPage({required this.items, this.page = 1, this.totalPages = 1});
}

class PrescriptionService {
  final _client = ApiClient.instance;

  Future<Prescription> upload(List<String> filePaths, {String source = 'UPLOAD'}) async {
    final formData = FormData();
    for (final path in filePaths) {
      formData.files.add(MapEntry('files', await MultipartFile.fromFile(path)));
    }
    formData.fields.add(MapEntry('source', source));

    return _client.unwrap(
      (dio) => dio.post('/prescriptions', data: formData),
      (data) => Prescription.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<PrescriptionPage> listMine({int page = 1, int limit = 10, String? status}) {
    return _client.unwrapWithMeta(
      (dio) => dio.get('/prescriptions/mine', queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
      }),
      (data, meta) {
        final items = (data as List<dynamic>? ?? const [])
            .map((e) => Prescription.fromJson(e as Map<String, dynamic>))
            .toList();
        return PrescriptionPage(
          items: items,
          page: meta != null ? asInt(meta['page'], page) : page,
          totalPages: meta != null ? asInt(meta['totalPages'], 1) : 1,
        );
      },
    );
  }

  Future<Prescription> getById(String id) {
    return _client.unwrap(
      (dio) => dio.get('/prescriptions/$id'),
      (data) => Prescription.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<String> getSignedFileUrl(String prescriptionId, String fileId) {
    return _client.unwrap(
      (dio) => dio.get('/prescriptions/$prescriptionId/files/$fileId/signed-url'),
      (data) => asString((data as Map<String, dynamic>)['url']),
    );
  }

  Future<Prescription> addClarification(String prescriptionId, String note) {
    return _client.unwrap(
      (dio) => dio.post('/prescriptions/$prescriptionId/clarifications', data: {'note': note}),
      (data) => Prescription.fromJson(data as Map<String, dynamic>),
    );
  }
}
