import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

/// Mirrors the web app's DoctorBanner (frontend/src/components/home/DoctorBanner.jsx).
class DoctorBanner extends StatelessWidget {
  final VoidCallback onSchedule;

  const DoctorBanner({super.key, required this.onSchedule});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: AppColors.accentButtonGradient,
          borderRadius: BorderRadius.circular(28),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 46,
              width: 46,
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.medical_information_outlined, color: Colors.white, size: 22),
            ),
            const SizedBox(height: 14),
            const Text(
              'Doctor consultation, video/audio, 24 hours',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800, height: 1.3),
            ),
            const SizedBox(height: 8),
            RichText(
              text: TextSpan(
                style: TextStyle(color: Colors.white.withValues(alpha: 0.92), fontSize: 12.5, height: 1.4),
                children: const [
                  TextSpan(text: 'Schedule an appointment with a verified doctor. Get 10% off with promo code '),
                  TextSpan(text: 'EPDT10', style: TextStyle(fontWeight: FontWeight.w800)),
                  TextSpan(text: '.'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onSchedule,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.accent700,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                ),
                child: const Text('Schedule appointment'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
