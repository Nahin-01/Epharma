import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

class _Feature {
  final IconData icon;
  final Gradient gradient;
  final String title;
  final String description;

  const _Feature({required this.icon, required this.gradient, required this.title, required this.description});
}

const _features = [
  _Feature(
    icon: Icons.verified_user_outlined,
    gradient: AppColors.primaryButtonGradient,
    title: '100% Genuine Medicine',
    description: 'Sourced directly from licensed manufacturers and distributors — every batch is traceable.',
  ),
  _Feature(
    icon: Icons.local_shipping_outlined,
    gradient: AppColors.accentButtonGradient,
    title: 'Fast, Tracked Delivery',
    description: 'Same-day delivery across Dhaka, with live order tracking from pack to doorstep.',
  ),
  _Feature(
    icon: Icons.how_to_reg_outlined,
    gradient: LinearGradient(colors: [AppColors.slate700, AppColors.slate800]),
    title: 'Licensed Pharmacists',
    description: 'Every prescription is reviewed by a registered pharmacist before it ships — no exceptions.',
  ),
  _Feature(
    icon: Icons.lock_outline_rounded,
    gradient: LinearGradient(colors: [AppColors.brand400, AppColors.brand500]),
    title: 'Secure Payments',
    description: 'Pay by cash on delivery today, with bKash, Nagad, Rocket and card checkout coming soon.',
  ),
];

/// Mirrors the web app's WhyChooseUs (frontend/src/components/home/WhyChooseUs.jsx).
class WhyChooseUs extends StatelessWidget {
  const WhyChooseUs({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          const Text('Why choose ePharmacy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.slate900)),
          const SizedBox(height: 6),
          Text(
            'Everything about how we operate is built around one thing: getting you the right medicine, safely.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.5, color: AppColors.slate500.withValues(alpha: 0.95)),
          ),
          const SizedBox(height: 18),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _features.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.82,
            ),
            itemBuilder: (context, i) {
              final f = _features[i];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.slate100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 40,
                      width: 40,
                      decoration: BoxDecoration(gradient: f.gradient, borderRadius: BorderRadius.circular(14)),
                      child: Icon(f.icon, color: Colors.white, size: 19),
                    ),
                    const SizedBox(height: 10),
                    Text(f.title, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                    const SizedBox(height: 4),
                    Expanded(
                      child: Text(
                        f.description,
                        style: const TextStyle(fontSize: 10.5, color: AppColors.slate500, height: 1.35),
                        overflow: TextOverflow.fade,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
