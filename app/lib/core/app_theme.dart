import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.brand600,
        primary: AppColors.brand600,
        secondary: AppColors.accent500,
        surface: Colors.white,
        error: AppColors.red600,
      ),
      scaffoldBackgroundColor: AppColors.slate50,
      fontFamily: GoogleFonts.inter().fontFamily,
    );

    final displayFont = GoogleFonts.poppinsTextTheme(base.textTheme);
    final bodyFont = GoogleFonts.interTextTheme(base.textTheme);

    return base.copyWith(
      textTheme: bodyFont.copyWith(
        displayLarge: displayFont.displayLarge?.copyWith(fontWeight: FontWeight.w800, color: AppColors.slate900),
        displayMedium: displayFont.displayMedium?.copyWith(fontWeight: FontWeight.w800, color: AppColors.slate900),
        headlineLarge: displayFont.headlineLarge?.copyWith(fontWeight: FontWeight.w700, color: AppColors.slate900),
        headlineMedium: displayFont.headlineMedium?.copyWith(fontWeight: FontWeight.w700, color: AppColors.slate900),
        headlineSmall: displayFont.headlineSmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.slate900),
        titleLarge: displayFont.titleLarge?.copyWith(fontWeight: FontWeight.w700, color: AppColors.slate900),
        titleMedium: bodyFont.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: AppColors.slate800),
        bodyLarge: bodyFont.bodyLarge?.copyWith(color: AppColors.slate700),
        bodyMedium: bodyFont.bodyMedium?.copyWith(color: AppColors.slate600),
        labelLarge: bodyFont.labelLarge?.copyWith(fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.slate900,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.slate100),
        ),
        margin: EdgeInsets.zero,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.slate200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.slate200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.brand500, width: 1.6),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.red600, width: 1.2),
        ),
        labelStyle: const TextStyle(color: AppColors.slate600),
        hintStyle: const TextStyle(color: AppColors.slate400),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brand600,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.slate700,
          side: const BorderSide(color: AppColors.slate200, width: 1.4),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.brand700,
          textStyle: const TextStyle(fontWeight: FontWeight.w600),
        ),
      ),
      chipTheme: base.chipTheme.copyWith(
        backgroundColor: AppColors.brand50,
        labelStyle: const TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w600, fontSize: 12),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      dividerTheme: const DividerThemeData(color: AppColors.slate100, thickness: 1, space: 1),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.brand700,
        unselectedItemColor: AppColors.slate400,
        type: BottomNavigationBarType.fixed,
        elevation: 12,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.w600, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontSize: 11),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.slate900,
        contentTextStyle: const TextStyle(color: Colors.white),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
