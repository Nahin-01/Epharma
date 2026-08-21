import 'package:flutter/material.dart';

/// Mirrors the brand (teal) / accent (coral) palette used by the React
/// web app's tailwind.config.js, so the mobile app and website feel like
/// one product.
class AppColors {
  AppColors._();

  static const brand50 = Color(0xFFF0FDFA);
  static const brand100 = Color(0xFFCCFBF1);
  static const brand200 = Color(0xFF99F6E4);
  static const brand300 = Color(0xFF5EEAD4);
  static const brand400 = Color(0xFF2DD4BF);
  static const brand500 = Color(0xFF14B8A6);
  static const brand600 = Color(0xFF0D9488);
  static const brand700 = Color(0xFF0F766E);
  static const brand800 = Color(0xFF115E59);
  static const brand900 = Color(0xFF134E4A);

  static const accent50 = Color(0xFFFFF7ED);
  static const accent100 = Color(0xFFFFEDD5);
  static const accent200 = Color(0xFFFED7AA);
  static const accent300 = Color(0xFFFDBA74);
  static const accent400 = Color(0xFFFB923C);
  static const accent500 = Color(0xFFF97316);
  static const accent600 = Color(0xFFEA580C);
  static const accent700 = Color(0xFFC2410C);

  static const slate50 = Color(0xFFF8FAFC);
  static const slate100 = Color(0xFFF1F5F9);
  static const slate200 = Color(0xFFE2E8F0);
  static const slate300 = Color(0xFFCBD5E1);
  static const slate400 = Color(0xFF94A3B8);
  static const slate500 = Color(0xFF64748B);
  static const slate600 = Color(0xFF475569);
  static const slate700 = Color(0xFF334155);
  static const slate800 = Color(0xFF1E293B);
  static const slate900 = Color(0xFF0F172A);

  static const red600 = Color(0xFFDC2626);
  static const emerald600 = Color(0xFF059669);
  static const amber600 = Color(0xFFD97706);

  static const heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [brand800, brand700, brand600],
  );

  static const primaryButtonGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [brand600, brand500],
  );

  static const accentButtonGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [accent500, accent600],
  );

  /// Deterministic gradient pair for product placeholder art, mirroring the
  /// web app's ProductImagePlaceholder — same product always renders the
  /// same gradient (hash of its id/name), no external image dependency.
  static const List<List<Color>> placeholderGradients = [
    [Color(0xFF0D9488), Color(0xFF115E59)],
    [Color(0xFFEA580C), Color(0xFFC2410C)],
    [Color(0xFF0F766E), Color(0xFF134E4A)],
    [Color(0xFFFB923C), Color(0xFFEA580C)],
    [Color(0xFF14B8A6), Color(0xFF0F766E)],
    [Color(0xFF334155), Color(0xFF1E293B)],
  ];
}
