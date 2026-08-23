import 'package:google_sign_in/google_sign_in.dart';

import '../core/app_constants.dart';
import '../core/validators.dart';
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

  /// Signs up via Supabase directly - the same identity provider the web
  /// app uses (see frontend/src/context/AuthContext.jsx's register()) - so
  /// both clients share one user store instead of this backend's own local
  /// accounts table.
  Future<AuthResult> register({required String name, String? email, String? phone, required String password}) async {
    final hasEmail = email != null && email.isNotEmpty;
    final hasPhone = phone != null && phone.isNotEmpty;
    final normalizedPhone = hasPhone ? normalizePhone(phone) : null;
    final response = await SupabaseAuthClient.instance.signUp(
      email: hasEmail ? email : null,
      phone: hasEmail ? null : normalizedPhone,
      password: password,
      metadata: {'name': name, 'full_name': name, if (hasPhone) 'phone': normalizedPhone},
    );
    final accessToken = response['access_token'] as String?;
    if (accessToken == null) {
      throw ApiException('Account created. Check your email to confirm your account, then sign in.');
    }
    final refreshToken = response['refresh_token'] as String?;
    await TokenStorage.instance.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    final user = await getMe();
    return AuthResult(user: user, accessToken: accessToken, refreshToken: refreshToken);
  }

  /// Mirrors the web app's `supabase.auth.signInWithPassword` call so manual
  /// login behaves identically (same user store, same password rules) on
  /// both clients.
  Future<AuthResult> login({required String identifier, required String password}) async {
    final isEmail = identifier.contains('@');
    final session = await SupabaseAuthClient.instance.signInWithPassword(
      email: isEmail ? identifier : null,
      phone: isEmail ? null : normalizePhone(identifier),
      password: password,
    );
    final accessToken = session['access_token'] as String;
    final refreshToken = session['refresh_token'] as String?;
    await TokenStorage.instance.saveTokens(accessToken: accessToken, refreshToken: refreshToken);
    final user = await getMe();
    return AuthResult(user: user, accessToken: accessToken, refreshToken: refreshToken);
  }

  /// Returns the OTP code when the backend's SMS_PROVIDER is "mock" (dev
  /// only - see requestOtp in backend/src/modules/auth/auth.service.js).
  /// Null in every other case, since the SMS was actually sent for real.
  Future<String?> requestOtp({required String phone, String purpose = 'LOGIN'}) {
    return _client.unwrap(
      (dio) => dio.post('/auth/otp/request', data: {'phone': normalizePhone(phone), 'purpose': purpose}),
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
        'phone': normalizePhone(phone),
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
    final google = GoogleSignIn(serverClientId: AppConstants.googleClientId);
    // Google Play Services caches the last-used account for this app and
    // silently reuses it on the next signIn() instead of showing the account
    // picker. Signing out first clears that cache so the chooser always
    // appears, letting the user pick a different Google account.
    await google.signOut();
    final googleAccount = await google.signIn();
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
      (dio) => dio.post('/auth/forgot-password', data: {'phone': normalizePhone(phone)}),
      (data) => asStringOrNull((data as Map<String, dynamic>?)?['devCode']),
    );
  }

  Future<void> resetPassword({required String phone, required String code, required String newPassword}) {
    return _client.unwrap(
      (dio) => dio.post('/auth/reset-password', data: {'phone': normalizePhone(phone), 'code': code, 'newPassword': newPassword}),
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
