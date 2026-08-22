import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../models/category.dart';

const _tileGradients = [
  AppColors.primaryButtonGradient,
  LinearGradient(colors: [AppColors.accent400, AppColors.accent500]),
  LinearGradient(colors: [AppColors.slate600, AppColors.slate700]),
  LinearGradient(colors: [AppColors.brand400, AppColors.brand500]),
  AppColors.accentButtonGradient,
  LinearGradient(colors: [AppColors.brand600, AppColors.brand800]),
];

/// Mirrors the web app's CategoryStrip (frontend/src/components/home/CategoryStrip.jsx) -
/// a wrapping grid rather than the old horizontally-scrolling strip.
class CategoryGrid extends StatelessWidget {
  final List<Category>? categories;
  final void Function(Category category) onTap;

  const CategoryGrid({super.key, required this.categories, required this.onTap});

  @override
  Widget build(BuildContext context) {
    if (categories != null && categories!.isEmpty) return const SizedBox.shrink();

    final items = categories?.take(12).toList();
    final count = items?.length ?? 6;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Shop by Category', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.slate900)),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: count,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.86,
            ),
            itemBuilder: (context, index) {
              if (items == null) return const _CategoryTileSkeleton();
              final category = items[index];
              return _CategoryTile(
                category: category,
                gradient: _tileGradients[index % _tileGradients.length],
                onTap: () => onTap(category),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _CategoryTile extends StatelessWidget {
  final Category category;
  final Gradient gradient;
  final VoidCallback onTap;

  const _CategoryTile({required this.category, required this.gradient, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.slate100),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                height: 48,
                width: 48,
                decoration: BoxDecoration(gradient: gradient, borderRadius: BorderRadius.circular(14)),
                alignment: Alignment.center,
                child: Text(category.icon ?? '🏷️', style: const TextStyle(fontSize: 20)),
              ),
              const SizedBox(height: 8),
              Text(
                category.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.slate700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryTileSkeleton extends StatelessWidget {
  const _CategoryTileSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.slate100)),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(height: 48, width: 48, decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(14))),
          const SizedBox(height: 8),
          Container(height: 8, width: 36, color: AppColors.slate100),
        ],
      ),
    );
  }
}
