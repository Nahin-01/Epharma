import 'package:flutter/material.dart';

import '../core/app_colors.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback? onViewAll;

  const SectionHeader({super.key, required this.title, this.onViewAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.slate900)),
          if (onViewAll != null)
            TextButton(
              onPressed: onViewAll,
              style: TextButton.styleFrom(foregroundColor: AppColors.brand700, padding: EdgeInsets.zero),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('View all', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                  Icon(Icons.arrow_forward_rounded, size: 15),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
