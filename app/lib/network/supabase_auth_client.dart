import 'package:dio/dio.dart';

import '../core/app_constants.dart';
import 'api_exception.dart';

/// Thin wrapper around Supabase's Auth REST API — just enough to exchange a
/// native Google ID token for a Supabase session, and later refresh that
/// session. This backend still issues and verifies its own JWTs for every
/// other flow; Supabase is only the identity provider for Google sign-in,
/// mirroring how the web app already does it (see frontend/src/lib/supabase.js).
class SupabaseAuthClient {
  SupabaseAuthClient._();

  static final instance = SupabaseAuthClient._();

  final _dio = Dio(
    BaseOptions(
      baseUrl: '${AppConstants.supabaseUrl}/auth/v1',
      headers: {'apikey': AppConstants.supabaseAnonKey},
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
    ),
  );

  Future<Map<String, dynamic>> signInWithGoogleIdToken({required String idToken, String? accessToken}) {
    return _post({
      'provider': 'google',
      'id_token': idToken,
      if (accessToken != null) 'access_token': accessToken,
    }, grantType: 'id_token');
  }

  /// Email/phone + password login - mirrors the web app's
  /// `supabase.auth.signInWithPassword` (see frontend/src/context/AuthContext.jsx).
  Future<Map<String, dynamic>> signInWithPassword({String? email, String? phone, required String password}) {
    return _post({
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      'password': password,
    }, grantType: 'password');
  }

  /// Returns the raw signup response, which is `{...user, id: ...}` with no
  /// `access_token` when Supabase requires email/phone confirmation first -
  /// callers must check for that case (see AuthService.register).
  Future<Map<String, dynamic>> signUp({
    String? email,
    String? phone,
    required String password,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final response = await _dio.post('/signup', data: {
        if (email != null) 'email': email,
        if (phone != null) 'phone': phone,
        'password': password,
        if (metadata != null) 'data': metadata,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  Future<Map<String, dynamic>> refresh(String refreshToken) {
    return _post({'refresh_token': refreshToken}, grantType: 'refresh_token');
  }

  Future<Map<String, dynamic>> _post(Map<String, dynamic> data, {required String grantType}) async {
    try {
      final response = await _dio.post('/token', queryParameters: {'grant_type': grantType}, data: data);
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      throw _mapDioError(e);
    }
  }

  ApiException _mapDioError(DioException e) {
    final body = e.response?.data;
    final message = body is Map && body['error_description'] is String
        ? body['error_description'] as String
        : body is Map && body['msg'] is String
            ? body['msg'] as String
            : 'Could not reach the sign-in service. Please try again.';
    return ApiException(message, statusCode: e.response?.statusCode);
  }
}
