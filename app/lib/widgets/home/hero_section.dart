import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

/// Mirrors the web app's HeroBanner (frontend/src/components/home/HeroBanner.jsx):
/// badge pill, headline, CTA buttons, and a live stats row. The desktop-only
/// illustration panel is skipped since the web version hides it on mobile too.
class HeroSection extends StatelessWidget {
  final int? productCount;
  final int? categoryCount;
  final VoidCallback onOrderMedicine;
  final VoidCallback onUploadPrescription;

  const HeroSection({
    super.key,
    required this.productCount,
    required this.categoryCount,
    required this.onOrderMedicine,
    required this.onUploadPrescription,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
        child: Stack(
          children: [
            Positioned(
              top: -50,
              left: -60,
              child: _blob(180, AppColors.accent500.withValues(alpha: 0.22)),
            ),
            Positioned(
              top: 80,
              right: -50,
              child: _blob(190, AppColors.brand300.withValues(alpha: 0.16)),
            ),
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 34),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(999)),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 12),
                          SizedBox(width: 6),
                          Text(
                            'GENUINE MEDICINE, DELIVERED',
                            style: TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w700, letterSpacing: 0.3),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    RichText(
                      text: const TextSpan(
                        style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, height: 1.2, color: Colors.white),
                        children: [
                          TextSpan(text: 'Your trusted '),
                          TextSpan(text: 'online pharmacy', style: TextStyle(color: AppColors.accent300)),
                          TextSpan(text: ' in Bangladesh'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Order medicine, upload your prescription, and get doorstep delivery — all tracked live from the moment you check out.',
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 13, height: 1.4),
                    ),
                    const SizedBox(height: 20),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        ElevatedButton.icon(
                          onPressed: onOrderMedicine,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.accent500,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                          icon: const Text('Order Medicine Online'),
                          label: const Icon(Icons.arrow_forward_rounded, size: 16),
                        ),
                        OutlinedButton(
                          onPressed: onUploadPrescription,
                          style: OutlinedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.brand700,
                            side: BorderSide.none,
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                          child: const Text('Upload Prescription'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    Row(
                      children: [
                        _Stat(value: productCount == null ? null : '${productCount}+', label: 'Medicines in stock'),
                        const SizedBox(width: 26),
                        _Stat(value: categoryCount == null ? null : '${categoryCount}+', label: 'Categories to browse'),
                        const SizedBox(width: 26),
                        const _Stat(value: '10 AM–9 PM', label: 'Prescription support'),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _blob(double size, Color color) {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}

class _Stat extends StatelessWidget {
  final String? value;
  final String label;

  const _Stat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (value == null)
          Container(height: 16, width: 44, margin: const EdgeInsets.only(bottom: 4), decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4)))
        else
          Text(value!, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w800)),
        Text(label, style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 10.5)),
      ],
    );
  }
}
