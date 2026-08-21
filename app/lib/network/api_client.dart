import 'dart:async';

import 'package:dio/dio.dart';

import '../core/app_constants.dart';
import 'api_exception.dart';
import 'supabase_auth_client.dart';
import 'token_storage.dart';

typedef SessionExpiredCallback = void Function();

/// The backend's local-storage provider returns file URLs relative to the
/// API origin (e.g. `/api/v1/files/signed?...`) rather than absolute ones —
/// mirrors `toAbsoluteFileUrl` in the web app's lib/apiClient.js.
String toAbsoluteFileUrl(String url) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  final base = Uri.parse(AppConstants.apiBaseUrl);
  final origin = '${base.scheme}://${base.authority}';
  return url.startsWith('/') ? '$origin$url' : '$origin/$url';
}

/// Single Dio instance shared by every service. Attaches the access token
/// to every request, and transparently refreshes + retries once on a 401
/// (mirrors the web app's axios interceptor in lib/apiClient.js), so screens
/// never have to think about token expiry themselves.
class ApiClient {
  ApiClient._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConstants.apiBaseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: const {'Accept': 'application/json'},
      ),
    );

    _plainDio = Dio(BaseOptions(baseUrl: AppConstants.apiBaseUrl));

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await TokenStorage.instance.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (DioException error, handler) async {
          final response = error.response;
          final requestOptions = error.requestOptions;
          final isAuthRoute = requestOptions.path.contains('/auth/');
          final alreadyRetried = requestOptions.extra['retried'] == true;

          if (response?.statusCode == 401 && !isAuthRoute && !alreadyRetried) {
            try {
              final tokens = await _refreshTokens();
              requestOptions.extra['retried'] = true;
              requestOptions.headers['Authorization'] = 'Bearer ${tokens['accessToken']}';
              final cloned = await _dio.fetch(requestOptions);
              return handler.resolve(cloned);
            } catch (_) {
              await TokenStorage.instance.clear();
              _notifySessionExpired();
              return handler.next(error);
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();

  late final Dio _dio;
  late final Dio _plainDio;

  Dio get dio => _dio;

  Future<Map<String, dynamic>>? _refreshFuture;
  final List<SessionExpiredCallback> _listeners = [];

  void addSessionExpiredListener(SessionExpiredCallback cb) => _listeners.add(cb);

  void removeSessionExpiredListener(SessionExpiredCallback cb) => _listeners.remove(cb);

  void _notifySessionExpired() {
    for (final cb in List<SessionExpiredCallback>.from(_listeners)) {
      cb();
    }
  }

  Future<Map<String, dynamic>> _refreshTokens() {
    _refreshFuture ??= _doRefresh();
    return _refreshFuture!.whenComplete(() => _refreshFuture = null);
  }

  Future<Map<String, dynamic>> _doRefresh() async {
    final refreshToken = await TokenStorage.instance.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) {
      throw ApiException('No refresh token available');
    }
    try {
      final response = await _plainDio.post('/auth/refresh-token', data: {'refreshToken': refreshToken});
      final body = response.data as Map<String, dynamic>;
      final data = body['data'] as Map<String, dynamic>;
      await TokenStorage.instance.saveTokens(
        accessToken: data['accessToken'] as String,
        refreshToken: data['refreshToken'] as String?,
      );
      return data;
    } on DioException {
      // This wasn't a token this backend issued (e.g. a Google sign-in's
      // Supabase refresh token) - ask Supabase to refresh it instead.
      final session = await SupabaseAuthClient.instance.refresh(refreshToken);
      final accessToken = session['access_token'] as String;
      final newRefreshToken = session['refresh_token'] as String?;
      await TokenStorage.instance.saveTokens(accessToken: accessToken, refreshToken: newRefreshToken);
      return {'accessToken': accessToken, 'refreshToken': newRefreshToken};
    }
  }

  /// Runs [request], unwraps the backend's `{ success, message, data }`
  /// envelope, and hands the raw `data` payload to [mapper]. Any failure
  /// (network or server) is normalized into an [ApiException].
  Future<T> unwrap<T>(
    Future<Response<dynamic>> Function(Dio dio) request,
    T Function(dynamic data) mapper,
  ) async {
    try {
      final response = await request(_dio);
      final body = response.data;
      if (body is Map<String, dynamic>) {
        return mapper(body['data']);
      }
      return mapper(body);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  /// Same as [unwrap] but also hands the response's `meta` block (used for
  /// pagination: page/limit/total/totalPages) to [mapper].
  Future<T> unwrapWithMeta<T>(
    Future<Response<dynamic>> Function(Dio dio) request,
    T Function(dynamic data, Map<String, dynamic>? meta) mapper,
  ) async {
    try {
      final response = await request(_dio);
      final body = response.data;
      if (body is Map<String, dynamic>) {
        final meta = body['meta'];
        return mapper(body['data'], meta is Map<String, dynamic> ? meta : null);
      }
      return mapper(body, null);
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  ApiException _mapError(DioException e) {
    final response = e.response;
    if (response != null) {
      final body = response.data;
      String message = 'Something went wrong. Please try again.';
      Map<String, dynamic>? errors;
      if (body is Map<String, dynamic>) {
        final serverMessage = body['message'];
        if (serverMessage is String && serverMessage.isNotEmpty) message = serverMessage;
        if (body['errors'] is Map<String, dynamic>) {
          errors = body['errors'] as Map<String, dynamic>;
        }
      }
      return ApiException(message, statusCode: response.statusCode, errors: errors);
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.connectionError) {
      return ApiException('Could not reach the server. Please check your connection and try again.');
    }
    return ApiException(e.message ?? 'Something went wrong. Please try again.');
  }
}
