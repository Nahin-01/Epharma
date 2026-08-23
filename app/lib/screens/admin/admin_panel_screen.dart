import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../core/app_colors.dart';
import '../../network/supabase_auth_client.dart';
import '../../network/token_storage.dart';

/// Loads the existing web admin dashboard inside the app instead of handing
/// off to an external browser tab - the whole admin suite (products, orders,
/// inventory, etc.) already lives there, so this avoids rebuilding it
/// natively while still keeping staff inside the app shell.
class AdminPanelScreen extends StatefulWidget {
  static const routeName = '/admin-panel';

  const AdminPanelScreen({super.key});

  @override
  State<AdminPanelScreen> createState() => _AdminPanelScreenState();
}

class _AdminPanelScreenState extends State<AdminPanelScreen> {
  static const _origin = 'https://epharma-2mo5.vercel.app';
  static const _adminUrl = '$_origin/admin';
  // The Supabase JS SDK's own localStorage key format: "sb-<project-ref>-auth-token".
  static const _supabaseProjectRef = 'bmdnxicyfukqmfdcshpt';

  late final WebViewController _controller;
  bool _loading = true;
  bool _ssoAttempted = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (_) => setState(() => _loading = true),
          onPageFinished: _onPageFinished,
        ),
      )
      // Land on the public home page first - it needs no auth, and gives us
      // a same-origin document to seed localStorage in before the real
      // navigation to /admin, so the web app finds a session already
      // waiting instead of showing its own login screen.
      ..loadRequest(Uri.parse(_origin));
  }

  Future<void> _onPageFinished(String url) async {
    if (!_ssoAttempted) {
      _ssoAttempted = true;
      final seeded = await _seedSupabaseSession();
      if (seeded) {
        await _controller.loadRequest(Uri.parse(_adminUrl));
        return; // wait for the /admin navigation's own onPageFinished
      }
    }
    if (mounted) setState(() => _loading = false);
  }

  /// The app is already signed in via Supabase (email/password or Google),
  /// so instead of making staff log in a second time inside the WebView,
  /// this hands the same session to the web app the same way it would
  /// persist across a page reload in a real browser: by writing it to
  /// localStorage under the key the Supabase JS SDK itself uses.
  ///
  /// Uses a fresh refresh-token exchange (rather than the possibly-stale
  /// access token already in TokenStorage) so the injected session is
  /// actually valid, and saves the rotated tokens back so the app's own
  /// session keeps working afterwards. Returns false (leaving the WebView to
  /// show its normal login page) for anything that isn't a real Supabase
  /// session, e.g. a phone/OTP login's locally-issued token.
  Future<bool> _seedSupabaseSession() async {
    final refreshToken = await TokenStorage.instance.getRefreshToken();
    if (refreshToken == null) return false;
    try {
      final session = await SupabaseAuthClient.instance.refresh(refreshToken);
      await TokenStorage.instance.saveTokens(
        accessToken: session['access_token'] as String,
        refreshToken: session['refresh_token'] as String?,
      );
      const key = 'sb-$_supabaseProjectRef-auth-token';
      final valueLiteral = jsonEncode(jsonEncode(session));
      await _controller.runJavaScript("window.localStorage.setItem('$key', $valueLiteral);");
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: const Text('Admin Panel'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => _controller.reload(),
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading) const Center(child: CircularProgressIndicator(color: AppColors.brand600)),
        ],
      ),
    );
  }
}
