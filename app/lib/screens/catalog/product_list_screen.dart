import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../models/product.dart';
import '../../network/api_exception.dart';
import '../../services/product_service.dart';
import '../../widgets/add_to_cart.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/product_card.dart';
import '../../widgets/skeletons.dart';
import 'product_detail_screen.dart';

class ProductListScreen extends StatefulWidget {
  static const routeName = '/products';

  final String title;
  final String? categoryId;
  final String? initialSearch;
  final bool? isFeatured;
  final bool? isBestSeller;
  final String? sort;

  const ProductListScreen({
    super.key,
    this.title = 'All Medicines',
    this.categoryId,
    this.initialSearch,
    this.isFeatured,
    this.isBestSeller,
    this.sort,
  });

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  final _productService = ProductService();
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  final List<Product> _items = [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  int _page = 1;
  String? _error;
  late String _search;

  @override
  void initState() {
    super.initState();
    _search = widget.initialSearch ?? '';
    _searchController.text = _search;
    _scrollController.addListener(_onScroll);
    _load(reset: true);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_hasMore || _loadingMore || _loading) return;
    if (_scrollController.position.pixels > _scrollController.position.maxScrollExtent - 300) {
      _load();
    }
  }

  Future<void> _load({bool reset = false}) async {
    if (reset) {
      setState(() {
        _loading = true;
        _error = null;
        _page = 1;
        _items.clear();
        _hasMore = true;
      });
    } else {
      setState(() => _loadingMore = true);
    }
    try {
      final page = await _productService.list(
        page: reset ? 1 : _page + 1,
        limit: 20,
        search: _search.isEmpty ? null : _search,
        category: widget.categoryId,
        isFeatured: widget.isFeatured,
        isBestSeller: widget.isBestSeller,
        sort: widget.sort,
      );
      setState(() {
        if (reset) {
          _items
            ..clear()
            ..addAll(page.items);
        } else {
          _items.addAll(page.items);
        }
        _page = page.page;
        _hasMore = page.hasMore;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not load products right now.');
    } finally {
      setState(() {
        _loading = false;
        _loadingMore = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: Text(widget.title),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: TextField(
              controller: _searchController,
              textInputAction: TextInputAction.search,
              onSubmitted: (value) {
                _search = value.trim();
                _load(reset: true);
              },
              decoration: InputDecoration(
                hintText: 'Search medicine, brand, or health product…',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                suffixIcon: _search.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          _search = '';
                          _load(reset: true);
                        },
                      )
                    : null,
              ),
            ),
          ),
          Expanded(child: _buildBody()),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) return const ProductGridSkeleton(count: 8);

    if (_error != null && _items.isEmpty) {
      return ErrorState(message: _error!, onRetry: () => _load(reset: true));
    }

    if (_items.isEmpty) {
      return const EmptyState(
        icon: Icons.search_off_rounded,
        title: 'No products found',
        message: 'Try a different search term or check back later — the catalogue updates often.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => _load(reset: true),
      child: GridView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.fromLTRB(14, 8, 14, 24),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 14,
          crossAxisSpacing: 12,
          // Shorter ratio than before so there's room for the "Add to bag"
          // button below the price without the card overflowing.
          childAspectRatio: 0.54,
        ),
        itemCount: _items.length + (_hasMore ? 2 : 0),
        itemBuilder: (context, index) {
          if (index >= _items.length) return const ProductCardSkeleton(width: double.infinity);
          final product = _items[index];
          return ProductCard(
            width: double.infinity,
            product: product,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => ProductDetailScreen(slug: product.slug)),
            ),
            onAdd: () => addToCartFlow(context, product),
          );
        },
      ),
    );
  }
}
