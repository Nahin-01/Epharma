import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../network/api_client.dart';
import '../network/token_storage.dart';
import '../services/auth_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

/// Holds the current session. On app start it checks for a stored access
/// token and, if present, fetches the live user record — it never trusts
/// stale local data, matching the web app's AuthContext behavior.
class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    ApiClient.instance.addSessionExpiredListener(_handleSessionExpired);
    _bootstrap();
  }

  final _authService = AuthService();

  AppUser? _user;
  AuthStatus _status = AuthStatus.unknown;

  AppUser? get user => _user;
  AuthStatus get status => _status;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _status == AuthStatus.unknown;

  Future<void> _bootstrap() async {
    final token = await TokenStorage.instance.getAccessToken();
    if (token == null || token.isEmpty) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      _user = await _authService.getMe();
      _status = AuthStatus.authenticated;
    } catch (_) {
      await TokenStorage.instance.clear();
      _user = null;
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  void _handleSessionExpired() {
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> _applyAuthResult(AuthResult result) async {
    await TokenStorage.instance.saveTokens(accessToken: result.accessToken, refreshToken: result.refreshToken);
    _user = result.user;
    _status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> login(String identifier, String password) async {
    final result = await _authService.login(identifier: identifier, password: password);
    await _applyAuthResult(result);
  }

  Future<void> register({required String name, String? email, String? phone, required String password}) async {
    final result = await _authService.register(name: name, email: email, phone: phone, password: password);
    await _applyAuthResult(result);
  }

  Future<String?> requestOtp({required String phone, String purpose = 'LOGIN'}) {
    return _authService.requestOtp(phone: phone, purpose: purpose);
  }

  Future<bool> verifyOtp({required String phone, required String code, String purpose = 'LOGIN', String? name}) async {
    final result = await _authService.verifyOtp(phone: phone, code: code, purpose: purpose, name: name);
    if (result != null) {
      await _applyAuthResult(result);
      return true;
    }
    return false;
  }

  /// Returns false if the user cancelled the Google account picker (not an
  /// error); throws on a genuine failure; returns true once signed in.
  Future<bool> googleSignIn() async {
    final result = await _authService.googleSignIn();
    if (result == null) return false;
    await _applyAuthResult(result);
    return true;
  }

  Future<String?> forgotPassword(String phone) => _authService.forgotPassword(phone);

  Future<void> resetPassword({required String phone, required String code, required String newPassword}) {
    return _authService.resetPassword(phone: phone, code: code, newPassword: newPassword);
  }

  Future<void> refreshProfile() async {
    _user = await _authService.getMe();
    notifyListeners();
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  @override
  void dispose() {
    ApiClient.instance.removeSessionExpiredListener(_handleSessionExpired);
    super.dispose();
  }
}
