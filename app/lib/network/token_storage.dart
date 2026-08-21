import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/app_constants.dart';

/// Thin wrapper around flutter_secure_storage so the rest of the app never
/// touches raw storage keys directly.
class TokenStorage {
  TokenStorage._internal();
  static final TokenStorage instance = TokenStorage._internal();

  final _storage = const FlutterSecureStorage();

  Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    await _storage.write(key: AppConstants.secureAccessTokenKey, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: AppConstants.secureRefreshTokenKey, value: refreshToken);
    }
  }

  Future<String?> getAccessToken() => _storage.read(key: AppConstants.secureAccessTokenKey);

  Future<String?> getRefreshToken() => _storage.read(key: AppConstants.secureRefreshTokenKey);

  Future<void> clear() async {
    await _storage.delete(key: AppConstants.secureAccessTokenKey);
    await _storage.delete(key: AppConstants.secureRefreshTokenKey);
  }
}
