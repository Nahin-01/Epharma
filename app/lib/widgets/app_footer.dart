import 'package:flutter/material.dart';

import '../core/app_colors.dart';

// Only COD is actually wired up at checkout right now (see
// frontend/src/lib/constants.js PAYMENT_METHODS) - online gateways need a
// trade license we don't have yet, so don't advertise them here either.
const _paymentMethods = ['Cash on Delivery'];

/// Mirrors the web app's Footer (frontend/src/components/layout/Footer.jsx),
/// laid out as a scrollable block at the bottom of a page rather than a
/// persistent bar, since the app already has its own bottom nav.
class AppFooter extends StatelessWidget {
  final VoidCallback onHowToOrder;
  final VoidCallback onUploadPrescription;
  final VoidCallback onMyOrders;
  final VoidCallback onAboutUs;
  final VoidCallback onBestSellers;
  final VoidCallback onFeatured;
  final VoidCallback onAllMedicines;

  const AppFooter({
    super.key,
    required this.onHowToOrder,
    required this.onUploadPrescription,
    required this.onMyOrders,
    required this.onAboutUs,
    required this.onBestSellers,
    required this.onFeatured,
    required this.onAllMedicines,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [AppColors.slate900, Color(0xFF020617)]),
      ),
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                height: 34,
                width: 34,
                decoration: BoxDecoration(gradient: AppColors.primaryButtonGradient, borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.medication_rounded, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 10),
              RichText(
                text: const TextSpan(
                  style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Colors.white),
                  children: [
                    TextSpan(text: 'e'),
                    TextSpan(text: 'Pharmacy', style: TextStyle(color: AppColors.accent400)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            'Genuine medicine, delivered to your door. Upload a prescription or search the catalogue — everything you see is live from our pharmacy backend.',
            style: TextStyle(color: AppColors.slate400, fontSize: 12.5, height: 1.5),
          ),
          const SizedBox(height: 24),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _FooterColumn(
                  title: 'Quick Links',
                  items: [
                    _FooterLink('How to Order', onHowToOrder),
                    _FooterLink('Upload Prescription', onUploadPrescription),
                    _FooterLink('My Orders', onMyOrders),
                    _FooterLink('About Us', onAboutUs),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _FooterColumn(
                  title: 'Featured',
                  items: [
                    _FooterLink('Best Sellers', onBestSellers),
                    _FooterLink('Featured Products', onFeatured),
                    _FooterLink('All Medicines', onAllMedicines),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const _FooterColumn(
            title: 'Contact',
            items: [],
            staticLines: ['Hotline: 16000', 'support@epharmacy.example', 'Dhaka, Bangladesh'],
          ),
          const SizedBox(height: 24),
          const Divider(color: Colors.white10, height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('© ${DateTime.now().year} ePharmacy. All rights reserved.', style: const TextStyle(color: AppColors.slate500, fontSize: 11)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    const Text('We accept', style: TextStyle(color: AppColors.slate500, fontSize: 11)),
                    ..._paymentMethods.map(
                      (m) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white10),
                          color: Colors.white.withValues(alpha: 0.04),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(m, style: const TextStyle(color: AppColors.slate300, fontSize: 10.5, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterLink {
  final String label;
  final VoidCallback onTap;

  const _FooterLink(this.label, this.onTap);
}

class _FooterColumn extends StatelessWidget {
  final String title;
  final List<_FooterLink> items;
  final List<String> staticLines;

  const _FooterColumn({required this.title, required this.items, this.staticLines = const []});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        for (final link in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: GestureDetector(
              onTap: link.onTap,
              child: Text(link.label, style: const TextStyle(color: AppColors.slate400, fontSize: 12.5)),
            ),
          ),
        for (final line in staticLines)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(line, style: const TextStyle(color: AppColors.slate400, fontSize: 12.5)),
          ),
      ],
    );
  }
}
