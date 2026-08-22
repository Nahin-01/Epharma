import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

class _Step {
  final IconData icon;
  final String title;
  final String description;

  const _Step({required this.icon, required this.title, required this.description});
}

const _steps = [
  _Step(
    icon: Icons.search_rounded,
    title: 'Search or upload',
    description: 'Find your medicine in the catalogue, or upload a photo of your prescription in seconds.',
  ),
  _Step(
    icon: Icons.fact_check_outlined,
    title: 'Pharmacist reviews it',
    description: 'A licensed pharmacist checks every prescription before it ships — never an automated rubber stamp.',
  ),
  _Step(
    icon: Icons.local_shipping_outlined,
    title: 'Delivered to your door',
    description: 'Track your order live, pay however suits you, and get it delivered the same day in Dhaka.',
  ),
];

/// Mirrors the web app's HowItWorks (frontend/src/components/home/HowItWorks.jsx).
class HowItWorks extends StatelessWidget {
  const HowItWorks({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          const Text('How ePharmacy works', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.slate900)),
          const SizedBox(height: 6),
          Text(
            'Three simple steps between you and your medicine — no queues, no guesswork.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.5, color: AppColors.slate500.withValues(alpha: 0.95)),
          ),
          const SizedBox(height: 22),
          Column(
            children: List.generate(_steps.length, (i) {
              final step = _steps[i];
              return Padding(
                padding: EdgeInsets.only(bottom: i == _steps.length - 1 ? 0 : 20),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 52,
                      width: 52,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.brand50, width: 4),
                        boxShadow: [BoxShadow(color: AppColors.slate900.withValues(alpha: 0.06), blurRadius: 12, offset: const Offset(0, 4))],
                      ),
                      child: Icon(step.icon, color: AppColors.brand600, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(999)),
                            child: Text('STEP ${i + 1}', style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppColors.brand700)),
                          ),
                          const SizedBox(height: 6),
                          Text(step.title, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                          const SizedBox(height: 3),
                          Text(step.description, style: const TextStyle(fontSize: 12, color: AppColors.slate500, height: 1.4)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
