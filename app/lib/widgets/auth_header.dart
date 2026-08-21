import 'package:flutter/material.dart';

import '../core/app_colors.dart';

/// Branded curved-gradient header shared by every auth screen (login,
/// register, OTP, forgot password) so the flow feels like one cohesive,
/// premium product rather than a bare form.
class AuthHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final double height;

  const AuthHeader({super.key, required this.title, required this.subtitle, this.height = 240});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: AppColors.heroGradient,
              borderRadius: BorderRadius.only(bottomLeft: Radius.circular(40), bottomRight: Radius.circular(40)),
            ),
          ),
          Positioned(
            top: -30,
            right: -30,
            child: _Blob(size: 140, color: AppColors.accent500.withValues(alpha: 0.28)),
          ),
          Positioned(
            bottom: -40,
            left: -20,
            child: _Blob(size: 120, color: Colors.white.withValues(alpha: 0.10)),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 18, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    height: 52,
                    width: 52,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 16, offset: const Offset(0, 6))],
                    ),
                    child: const Center(
                      child: Icon(Icons.medication_liquid_rounded, color: AppColors.brand600, size: 28),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    subtitle,
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13.5),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  final double size;
  final Color color;

  const _Blob({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}
