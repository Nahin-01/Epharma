import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../models/category.dart';
import '../../providers/auth_provider.dart';
import '../../services/category_service.dart';
import '../../widgets/product_rail.dart';
import '../catalog/product_list_screen.dart';
import '../prescriptions/upload_prescription_screen.dart';

class HomeScreen extends StatefulWidget {
  static const routeName = '/home';

  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _categoryService = CategoryService();
  List<Category>? _categories;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await _categoryService.tree();
      if (mounted) setState(() => _categories = categories);
    } catch (_) {
      if (mounted) setState(() => _categories = []);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.slate50,
      body: RefreshIndicator(
        onRefresh: _loadCategories,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            _Hero(greeting: auth.isAuthenticated ? 'Hi, ${auth.user?.displayName.split(' ').first ?? 'there'} 👋' : 'Welcome 👋'),
            Transform.translate(
              offset: const Offset(0, -22),
              child: Column(
                children: [
                  _CategoryStrip(categories: _categories),
                  ProductRail(
                    title: 'Best Sellers',
                    fetcher: (service) => service.list(isBestSeller: true, sort: 'best_selling', limit: 10),
                    onViewAll: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ProductListScreen(title: 'Best Sellers', isBestSeller: true)),
                    ),
                  ),
                  ProductRail(
                    title: 'Featured Products',
                    fetcher: (service) => service.list(isFeatured: true, limit: 10),
                    onViewAll: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ProductListScreen(title: 'Featured Products', isFeatured: true)),
                    ),
                  ),
                  ProductRail(
                    title: 'New In',
                    fetcher: (service) => service.list(sort: 'newest', limit: 10),
                    onViewAll: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ProductListScreen(title: 'New In', sort: 'newest')),
                    ),
                  ),
                  const SizedBox(height: 28),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  final String greeting;

  const _Hero({required this.greeting});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppColors.heroGradient,
        borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 46),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(greeting, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                  Container(
                    height: 8,
                    width: 8,
                    margin: const EdgeInsets.only(top: 4),
                    decoration: const BoxDecoration(color: AppColors.accent400, shape: BoxShape.circle),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              const Text(
                'Your trusted online pharmacy',
                style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, height: 1.25),
              ),
              const SizedBox(height: 18),
              GestureDetector(
                onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProductListScreen())),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                  child: const Row(
                    children: [
                      Icon(Icons.search_rounded, color: AppColors.slate400, size: 20),
                      SizedBox(width: 10),
                      Text(
                        'Search medicine, brand…',
                        style: TextStyle(color: AppColors.slate400, fontSize: 13.5),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _QuickAction(
                      icon: Icons.receipt_long_outlined,
                      label: 'Upload prescription',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const UploadPrescriptionScreen()),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _QuickAction(
                      icon: Icons.local_shipping_outlined,
                      label: 'Track orders',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const ProductListScreen()),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(14)),
        child: Row(
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryStrip extends StatelessWidget {
  final List<Category>? categories;

  const _CategoryStrip({required this.categories});

  @override
  Widget build(BuildContext context) {
    if (categories != null && categories!.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppColors.slate900.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: SizedBox(
        height: 92,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          itemCount: categories?.length ?? 5,
          separatorBuilder: (context, index) => const SizedBox(width: 14),
          itemBuilder: (context, index) {
            if (categories == null) {
              return const SizedBox(width: 62, child: _CategorySkeleton());
            }
            final category = categories![index];
            return SizedBox(
              width: 68,
              child: GestureDetector(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ProductListScreen(title: category.name, categoryId: category.id),
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      height: 52,
                      width: 52,
                      decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(16)),
                      child: const Icon(Icons.category_rounded, color: AppColors.brand600, size: 24),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      category.name,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppColors.slate700),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CategorySkeleton extends StatelessWidget {
  const _CategorySkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(height: 52, width: 52, decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(16))),
        const SizedBox(height: 6),
        Container(height: 8, width: 40, color: AppColors.slate100),
      ],
    );
  }
}
