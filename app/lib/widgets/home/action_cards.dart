import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

class _ActionCardData {
  final IconData icon;
  final Gradient gradient;
  final String title;
  final String description;
  final String cta;

  const _ActionCardData({
    required this.icon,
    required this.gradient,
    required this.title,
    required this.description,
    required this.cta,
  });
}

const _cards = [
  _ActionCardData(
    icon: Icons.autorenew_rounded,
    gradient: AppColors.primaryButtonGradient,
    title: 'Refill Request',
    description: 'Need to reorder the same medicine you bought before? Do it in one click.',
    cta: 'View my orders',
  ),
  _ActionCardData(
    icon: Icons.upload_file_rounded,
    gradient: AppColors.accentButtonGradient,
    title: 'Upload Prescription',
    description: 'Upload your prescription and get the medicine delivered right at your door step.',
    cta: 'Upload now',
  ),
  _ActionCardData(
    icon: Icons.medical_services_outlined,
    gradient: LinearGradient(colors: [AppColors.slate700, AppColors.slate800]),
    title: 'Doctor Consultation',
    description: 'Video/audio consultation, 24 hours. Doctor booking is launching soon.',
    cta: 'Notify me',
  ),
];

/// Mirrors the web app's ActionCards (frontend/src/components/home/ActionCards.jsx).
class ActionCards extends StatelessWidget {
  final VoidCallback onRefill;
  final VoidCallback onUpload;
  final VoidCallback onDoctor;

  const ActionCards({super.key, required this.onRefill, required this.onUpload, required this.onDoctor});

  @override
  Widget build(BuildContext context) {
    final callbacks = [onRefill, onUpload, onDoctor];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: List.generate(_cards.length, (i) {
          final card = _cards[i];
          return Padding(
            padding: EdgeInsets.only(bottom: i == _cards.length - 1 ? 0 : 12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: AppColors.slate900.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 8))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    height: 46,
                    width: 46,
                    decoration: BoxDecoration(gradient: card.gradient, borderRadius: BorderRadius.circular(16)),
                    child: Icon(card.icon, color: Colors.white, size: 22),
                  ),
                  const SizedBox(height: 12),
                  Text(card.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                  const SizedBox(height: 6),
                  Text(card.description, style: const TextStyle(fontSize: 12.5, color: AppColors.slate500, height: 1.4)),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: callbacks[i],
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(card.cta, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.brand700)),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_forward_rounded, size: 14, color: AppColors.brand700),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }
}
