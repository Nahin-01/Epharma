import 'package:flutter/material.dart';

import '../models/product.dart';
import '../services/product_service.dart';
import '../screens/catalog/product_detail_screen.dart';
import 'add_to_cart.dart';
import 'product_card.dart';
import 'section_header.dart';
import 'skeletons.dart';

/// Self-contained horizontal rail of products: fetches its own data (so the
/// home screen just declares "Best Sellers" / "Featured" / "New In" without
/// juggling loading state for each), and hides itself entirely if the
/// backend has nothing to show for that slice — no empty gap, no fake data.
class ProductRail extends StatefulWidget {
  final String title;
  final Future<ProductPage> Function(ProductService service) fetcher;
  final VoidCallback? onViewAll;

  const ProductRail({super.key, required this.title, required this.fetcher, this.onViewAll});

  @override
  State<ProductRail> createState() => _ProductRailState();
}

class _ProductRailState extends State<ProductRail> {
  final _productService = ProductService();
  List<Product>? _items;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final page = await widget.fetcher(_productService);
      if (mounted) setState(() => _items = page.items);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_failed) return const SizedBox.shrink();
    if (_items != null && _items!.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(top: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SectionHeader(title: widget.title, onViewAll: _items == null ? null : widget.onViewAll),
          const SizedBox(height: 12),
          SizedBox(
            height: 250,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _items?.length ?? 4,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                if (_items == null) return const ProductCardSkeleton();
                final product = _items![index];
                return ProductCard(
                  product: product,
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => ProductDetailScreen(slug: product.slug)),
                  ),
                  onAdd: () => addToCartFlow(context, product),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
