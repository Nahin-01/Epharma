import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../core/formatters.dart';
import '../../models/product.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/product_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_loader.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/product_card.dart';
import '../../widgets/product_image.dart';
import '../auth/login_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  static const routeName = '/product-detail';

  final String slug;

  const ProductDetailScreen({super.key, required this.slug});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _productService = ProductService();

  Product? _product;
  List<Product> _related = [];
  bool _loading = true;
  String? _error;
  int _quantity = 1;
  bool _addingToCart = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final product = await _productService.getBySlug(widget.slug);
      List<Product> related = [];
      try {
        related = await _productService.getRelated(product.id);
      } catch (_) {
        // Related products are a nice-to-have — ignore failures here.
      }
      setState(() {
        _product = product;
        _related = related;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not load this product right now.');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _addToCart() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    final product = _product;
    if (product == null) return;

    setState(() => _addingToCart = true);
    try {
      await context.read<CartProvider>().addItem(product.id, quantity: _quantity);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${product.name} added to your bag')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not add to bag. Please try again.')));
      }
    } finally {
      if (mounted) setState(() => _addingToCart = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('Product details')),
      body: _buildBody(),
      bottomNavigationBar: _product == null ? null : _buildBottomBar(_product!),
    );
  }

  Widget _buildBody() {
    if (_loading) return const AppLoader();
    if (_error != null || _product == null) {
      return ErrorState(message: _error ?? 'Product not found.', onRetry: _load);
    }

    final product = _product!;
    final discount = product.computedDiscountPercent;

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: ProductImage(
              imageUrl: product.primaryImage,
              seed: product.id,
              iconSize: 64,
              borderRadius: BorderRadius.zero,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (product.genericName != null)
                  Text(
                    product.genericName!.toUpperCase(),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.brand600),
                  ),
                const SizedBox(height: 4),
                Text(product.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.slate900)),
                const SizedBox(height: 4),
                if (product.manufacturer != null)
                  Text(product.manufacturer!, style: const TextStyle(fontSize: 13, color: AppColors.slate500)),
                const SizedBox(height: 14),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (product.strength != null) _Tag(text: product.strength!),
                    _Tag(text: product.dosageForm),
                    if (product.prescriptionRequired) const _Tag(text: 'Prescription required', color: AppColors.amber600),
                    _Tag(
                      text: product.inStock ? 'In stock' : 'Out of stock',
                      color: product.inStock ? AppColors.emerald600 : AppColors.red600,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      formatBDT(product.sellingPrice),
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.brand700),
                    ),
                    if (product.mrp > product.sellingPrice) ...[
                      const SizedBox(width: 10),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          formatBDT(product.mrp),
                          style: const TextStyle(fontSize: 15, color: AppColors.slate400, decoration: TextDecoration.lineThrough),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Text(
                          '$discount% OFF',
                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: AppColors.accent600),
                        ),
                      ),
                    ],
                  ],
                ),
                if (product.description != null && product.description!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  const Text('About this medicine', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                  const SizedBox(height: 6),
                  Text(product.description!, style: const TextStyle(fontSize: 13.5, color: AppColors.slate600, height: 1.5)),
                ],
                if (_related.isNotEmpty) ...[
                  const SizedBox(height: 26),
                  const Text('You may also need', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                  const SizedBox(height: 12),
                ],
              ],
            ),
          ),
          if (_related.isNotEmpty)
            SizedBox(
              height: 236,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 18),
                itemCount: _related.length,
                separatorBuilder: (context, index) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final related = _related[index];
                  return ProductCard(
                    product: related,
                    onTap: () => Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => ProductDetailScreen(slug: related.slug)),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBottomBar(Product product) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.slate100)),
        ),
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(border: Border.all(color: AppColors.slate200), borderRadius: BorderRadius.circular(10)),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: _quantity > 1 ? () => setState(() => _quantity -= 1) : null,
                    icon: const Icon(Icons.remove_rounded, size: 18),
                  ),
                  SizedBox(width: 24, child: Text('$_quantity', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700))),
                  IconButton(
                    onPressed: () => setState(() => _quantity += 1),
                    icon: const Icon(Icons.add_rounded, size: 18),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                label: product.inStock ? 'Add to bag' : 'Out of stock',
                loading: _addingToCart,
                onPressed: product.inStock ? _addToCart : null,
                icon: Icons.shopping_bag_outlined,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tag extends StatelessWidget {
  final String text;
  final Color color;

  const _Tag({required this.text, this.color = AppColors.slate600});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(999)),
      child: Text(text, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: color)),
    );
  }
}
