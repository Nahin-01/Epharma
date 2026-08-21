import 'package:google_sign_in/google_sign_in.dart';

import '../core/app_constants.dart';
import '../models/json_helpers.dart';
import '../models/user.dart';
import '../network/api_client.dart';
import '../network/api_exception.dart';
import '../network/supabase_auth_client.dart';
import '../network/token_storage.dart';

class AuthResult {
  final AppUser user;
  final String accessToken;
  final String? refreshToken;

  AuthResult({required this.user, required this.accessToken, this.refreshToken});
}

/// Wraps every `/auth/*` endpoint. Mirrors the web app's auth.api.js one to
/// one so both clients stay behaviorally identical against the same backend.
class AuthService {
  final _client = ApiClient.instance;

  Future<AuthResult> register({required String name, String? email, String? phone, required String password}) {
    return _client.unwrap(
      (dio) => dio.post('/auth/register', data: {
        'name': name,
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'password': password,
      }),
      _mapAuthResult,
    );
  }

  Future<AuthResult> login({required String identifier, required String password}) {
    return _client.unwrap(
      (dio) => dio.post('/auth/login', data: {'identifier': identifier, 'password': password}),
      _mapAuthResult,
    );
  }

  /// Returns the OTP code when the backend's SMS_PROVIDER is "mock" (dev
  /// only - see requestOtp in backend/src/modules/auth/auth.service.js).
  /// Null in every other case, since the SMS was actually sent for real.
  Future<String?> requestOtp({required String phone, String purpose = 'LOGIN'}) {
    return _client.unwrap(
      (dio) => dio.post('/auth/otp/request', data: {'phone': phone, 'purpose': purpose}),
      (data) => asStringOrNull((data as Map<String, dynamic>?)?['devCode']),
    );
  }

  /// Returns an [AuthResult] when the OTP flow logs the user in directly
  /// (purpose LOGIN/REGISTER), or null for purposes like RESET_PASSWORD
  /// that don't issue a session.
  Future<AuthResult?> verifyOtp({
    required String phone,
    required String code,
    String purpose = 'LOGIN',
    String? name,
  }) {
    return _client.unwrap(
      (dio) => dio.post('/auth/otp/verify', data: {
        'phone': phone,
        'code': code,
        'purpose': purpose,
        if (name != null && name.isNotEmpty) 'name': name,
      }),
      (data) {
        if (data is Map<String, dynamic> && data['user'] != null) {
          return _mapAuthResult(data);
        }
        return null;
      },
    );
  }

  /// Signs in with the native Google account picker, then exchanges the
  /// resulting ID token for a Supabase session — the same identity provider
  /// the web app uses for "Continue with Google". Returns null if the user
  /// cancels the picker (not an error). The Supabase access token this
  /// returns authenticates against this backend exactly like a local one
  /// (see auth.middleware.js), so the rest of the app never has to know the
  /// difference.
  Future<AuthResult?> googleSignIn() async {
    final googleAccount = await GoogleSignIn(serverClientId: AppConstants.googleClientId).signIn();
    if (googleAccount == null) return null;

    final googleAuth = await googleAccount.authentication;
    final idToken = googleAuth.idToken;
    if (idToken == null) {
      throw ApiException('Google did not return an ID token. Please try again.');
    }

    final session = await SupabaseAuthClient.instance.signInWithGoogleIdToken(
      idToken: idToken,
      accessToken: googleAuth.accessToken,
    );
    final accessToken = session['access_token'] as String;
    final refreshToken = session['refresh_token'] as String?;

    await TokenStorage.instance.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    final user = await getMe();
    return AuthResult(user: user, accessToken: accessToken, refreshToken: refreshToken);
  }

  /// Same dev-only devCode contract as [requestOtp] above.
  Future<String?> forgotPassword(String phone) {
    return _client.unwrap(
      (dio) => dio.post('/auth/forgot-password', data: {'phone': phone}),
      (data) => asStringOrNull((data as Map<String, dynamic>?)?['devCode']),
    );
  }

  Future<void> resetPassword({required String phone, required String code, required String newPassword}) {
    return _client.unwrap(
      (dio) => dio.post('/auth/reset-password', data: {'phone': phone, 'code': code, 'newPassword': newPassword}),
      (_) {},
    );
  }

  Future<void> changePassword({required String currentPassword, required String newPassword}) {
    return _client.unwrap(
      (dio) => dio.post('/auth/change-password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      }),
      (_) {},
    );
  }

  Future<void> logout() async {
    try {
      await _client.unwrap((dio) => dio.post('/auth/logout'), (_) {});
    } catch (_) {
      // Ignore network errors on logout — local session is cleared regardless.
    } finally {
      await TokenStorage.instance.clear();
    }
  }

  Future<AppUser> getMe() {
    return _client.unwrap((dio) => dio.get('/users/me'), (data) => AppUser.fromJson(data as Map<String, dynamic>));
  }

  AuthResult _mapAuthResult(dynamic data) {
    final map = data as Map<String, dynamic>;
    return AuthResult(
      user: AppUser.fromJson(map['user'] as Map<String, dynamic>),
      accessToken: map['accessToken'] as String,
      refreshToken: map['refreshToken'] as String?,
    );
  }
}
