/// Central place for anything environment-specific. The backend base URL
/// can be overridden at build/run time without touching code, e.g. to point
/// at a local dev server instead of the deployed one:
///
///   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api/v1
///
/// `10.0.2.2` is the Android emulator's alias for the host machine's
/// `localhost` — use it (not `localhost`) when running the backend on your
/// development machine and the app in the Android emulator. On a physical
/// device, use your machine's LAN IP instead. iOS simulator can use
/// `localhost` directly. See .vscode/launch.json for ready-made configs.
class AppConstants {
  AppConstants._();

  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://epharma-backend-j5y5.onrender.com/api/v1',
  );

  static const String appName = 'ePharmacy';

  /// Google Cloud "Web application" OAuth client ID — passed to google_sign_in
  /// as serverClientId so the ID token it returns is issued for the same
  /// audience Supabase's Google provider expects. Registering this Android
  /// app (package name + SHA-1) under the same Google Cloud project is also
  /// required; see app/README.md.
  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '851309774221-5g8o0nrb02jul2e0bpt39fh2lvnksfge.apps.googleusercontent.com',
  );

  /// Same Supabase project the web app uses. The anon key is a publishable
  /// key (governed by RLS/Auth policies, not a secret) so embedding it here
  /// is safe — it's already shipped inside the web app's JS bundle too.
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://bmdnxicyfukqmfdcshpt.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtZG54aWN5ZnVrcW1mZGNzaHB0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5ODc0NjYsImV4cCI6MjEwMjU2MzQ2Nn0.jFEZieuHX9Ztq8Ax3W0jMAWoY27OoLQCEhNLVlMFrcw',
  );

  static const secureAccessTokenKey = 'epharmacy_access_token';
  static const secureRefreshTokenKey = 'epharmacy_refresh_token';

  static const double freeDeliveryThreshold = 1000;
}
