import 'package:flutter/material.dart';

import '../core/app_colors.dart';

enum AppButtonVariant { primary, accent, outline, ghost }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final AppButtonVariant variant;
  final IconData? icon;
  final double height;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.variant = AppButtonVariant.primary,
    this.icon,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = loading || onPressed == null;

    Widget child = loading
        ? SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2.4,
              valueColor: AlwaysStoppedAnimation<Color>(
                variant == AppButtonVariant.outline || variant == AppButtonVariant.ghost
                    ? AppColors.brand600
                    : Colors.white,
              ),
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
              Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ],
          );

    if (variant == AppButtonVariant.outline) {
      return SizedBox(
        height: height,
        child: OutlinedButton(onPressed: disabled ? null : onPressed, child: child),
      );
    }
    if (variant == AppButtonVariant.ghost) {
      return SizedBox(
        height: height,
        child: TextButton(onPressed: disabled ? null : onPressed, child: child),
      );
    }

    final gradient = variant == AppButtonVariant.accent
        ? AppColors.accentButtonGradient
        : AppColors.primaryButtonGradient;

    return SizedBox(
      height: height,
      child: Opacity(
        opacity: disabled && !loading ? 0.6 : 1,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: gradient,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: (variant == AppButtonVariant.accent ? AppColors.accent500 : AppColors.brand600)
                    .withValues(alpha: 0.28),
                blurRadius: 18,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: disabled ? null : onPressed,
              child: Center(child: child),
            ),
          ),
        ),
      ),
    );
  }
}
