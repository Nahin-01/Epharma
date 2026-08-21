import 'package:flutter/material.dart';

import '../core/app_colors.dart';
import '../core/formatters.dart';
import '../models/product.dart';
import 'product_image.dart';

class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  final VoidCallback? onAdd;
  final double width;

  const ProductCard({
    super.key,
    required this.product,
    required this.onTap,
    this.onAdd,
    this.width = 168,
  });

  @override
  Widget build(BuildContext context) {
    final discount = product.computedDiscountPercent;

    return SizedBox(
      width: width,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(border: Border.all(color: AppColors.slate100)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ProductImage(
                        imageUrl: product.primaryImage,
                        seed: product.id.isNotEmpty ? product.id : product.name,
                        iconSize: 34,
                        borderRadius: BorderRadius.zero,
                      ),
                      if (discount > 0)
                        Positioned(
                          top: 8,
                          left: 8,
                          child: _Badge(text: '$discount% OFF', color: AppColors.accent600),
                        ),
                      if (product.prescriptionRequired)
                        const Positioned(
                          top: 8,
                          right: 8,
                          child: _Badge(text: 'Rx', color: AppColors.slate800),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.genericName != null)
                        Text(
                          product.genericName!.toUpperCase(),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.slate400),
                        ),
                      const SizedBox(height: 2),
                      Text(
                        product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.slate800, height: 1.25),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(
                            formatBDT(product.sellingPrice),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.brand700),
                          ),
                          if (product.mrp > product.sellingPrice) ...[
                            const SizedBox(width: 6),
                            Text(
                              formatBDT(product.mrp),
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: AppColors.slate400,
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (onAdd != null) ...[
                        const SizedBox(height: 8),
                        SizedBox(
                          width: double.infinity,
                          height: 34,
                          child: OutlinedButton(
                            onPressed: product.inStock ? onAdd : null,
                            style: OutlinedButton.styleFrom(
                              padding: EdgeInsets.zero,
                              side: const BorderSide(color: AppColors.brand200),
                              foregroundColor: AppColors.brand700,
                            ),
                            child: Text(
                              product.inStock ? 'Add to bag' : 'Out of stock',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;
  final Color color;

  const _Badge({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(999)),
      child: Text(
        text,
        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
      ),
    );
  }
}
