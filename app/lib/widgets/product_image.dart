import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/app_colors.dart';

/// If the product has a real photo, shows it (cached). Otherwise renders a
/// deterministic gradient + capsule icon derived from the product's id/name
/// hash — the same product always gets the same look, and the whole catalog
/// stays visually consistent without needing stock photography.
class ProductImage extends StatelessWidget {
  final String? imageUrl;
  final String seed;
  final double iconSize;
  final BorderRadius? borderRadius;

  const ProductImage({
    super.key,
    required this.imageUrl,
    required this.seed,
    this.iconSize = 40,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(16);

    if (imageUrl != null && imageUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: radius,
        child: CachedNetworkImage(
          imageUrl: imageUrl!,
          fit: BoxFit.cover,
          placeholder: (context, url) => _placeholder(radius),
          errorWidget: (context, url, error) => _placeholder(radius),
        ),
      );
    }
    return _placeholder(radius);
  }

  Widget _placeholder(BorderRadius radius) {
    final hash = seed.codeUnits.fold<int>(0, (prev, code) => prev + code);
    final colors = AppColors.placeholderGradients[hash % AppColors.placeholderGradients.length];

    return ClipRRect(
      borderRadius: radius,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: colors),
        ),
        child: Center(
          child: Container(
            padding: EdgeInsets.all(iconSize * 0.35),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.16), shape: BoxShape.circle),
            child: Icon(Icons.medication_liquid_rounded, color: Colors.white, size: iconSize),
          ),
        ),
      ),
    );
  }
}
