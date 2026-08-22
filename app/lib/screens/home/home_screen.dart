import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../models/category.dart';
import '../../providers/auth_provider.dart';
import '../../services/category_service.dart';
import '../../services/product_service.dart';
import '../../widgets/app_footer.dart';
import '../../widgets/home/action_cards.dart';
import '../../widgets/home/category_grid.dart';
import '../../widgets/home/doctor_banner.dart';
import '../../widgets/home/hero_section.dart';
import '../../widgets/home/how_it_works.dart';
import '../../widgets/home/trust_marquee.dart';
import '../../widgets/home/why_choose_us.dart';
import '../../widgets/product_rail.dart';
import '../auth/login_screen.dart';
import '../catalog/product_list_screen.dart';
import '../orders/orders_screen.dart';
import '../prescriptions/upload_prescription_screen.dart';
import '../profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  static const routeName = '/home';

  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _categoryService = CategoryService();
  final _productService = ProductService();
  List<Category>? _categories;
  int? _productCount;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadProductCount();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await _categoryService.tree();
      if (mounted) setState(() => _categories = categories);
    } catch (_) {
      if (mounted) setState(() => _categories = []);
    }
  }

  Future<void> _loadProductCount() async {
    try {
      final page = await _productService.list(limit: 1);
      if (mounted) setState(() => _productCount = page.total);
    } catch (_) {
      if (mounted) setState(() => _productCount = null);
    }
  }

  int _countCategories(List<Category> nodes) {
    var sum = 0;
    for (final n in nodes) {
      sum += 1 + _countCategories(n.children);
    }
    return sum;
  }

  void _openProducts({String title = 'All Medicines', String? categoryId, bool? isFeatured, bool? isBestSeller, String? sort}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ProductListScreen(title: title, categoryId: categoryId, isFeatured: isFeatured, isBestSeller: isBestSeller, sort: sort),
      ),
    );
  }

  void _openUploadPrescription() {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UploadPrescriptionScreen()));
  }

  void _openMyOrders() {
    final auth = context.read<AuthProvider>();
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => auth.isAuthenticated ? const OrdersScreen() : const LoginScreen()),
    );
  }

  void _notifyComingSoon(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final categoryCount = _categories == null ? null : _countCategories(_categories!);

    return Scaffold(
      backgroundColor: AppColors.slate50,
      body: RefreshIndicator(
        onRefresh: () async {
          await Future.wait([_loadCategories(), _loadProductCount()]);
        },
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            HeroSection(
              productCount: _productCount,
              categoryCount: categoryCount,
              onOrderMedicine: () => _openProducts(),
              onUploadPrescription: _openUploadPrescription,
            ),
            const SizedBox(height: 4),
            const TrustMarquee(),
            const SizedBox(height: 22),
            ActionCards(
              onRefill: _openMyOrders,
              onUpload: _openUploadPrescription,
              onDoctor: () => _notifyComingSoon('Doctor consultation booking is coming soon.'),
            ),
            const SizedBox(height: 26),
            CategoryGrid(
              categories: _categories,
              onTap: (category) => _openProducts(title: category.name, categoryId: category.id),
            ),
            const SizedBox(height: 30),
            const HowItWorks(),
            ProductRail(
              title: 'Best Sellers',
              fetcher: (service) => service.list(isBestSeller: true, sort: 'best_selling', limit: 10),
              onViewAll: () => _openProducts(title: 'Best Sellers', isBestSeller: true, sort: 'best_selling'),
            ),
            const SizedBox(height: 30),
            const WhyChooseUs(),
            const SizedBox(height: 26),
            DoctorBanner(onSchedule: () => _notifyComingSoon('Doctor appointment booking is coming soon.')),
            ProductRail(
              title: 'Featured Products',
              fetcher: (service) => service.list(isFeatured: true, limit: 10),
              onViewAll: () => _openProducts(title: 'Featured Products', isFeatured: true),
            ),
            ProductRail(
              title: 'New In',
              fetcher: (service) => service.list(sort: 'newest', limit: 10),
              onViewAll: () => _openProducts(title: 'New In', sort: 'newest'),
            ),
            const SizedBox(height: 30),
            AppFooter(
              onHowToOrder: () => _openProducts(),
              onUploadPrescription: _openUploadPrescription,
              onMyOrders: _openMyOrders,
              onAboutUs: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProfileScreen())),
              onBestSellers: () => _openProducts(title: 'Best Sellers', isBestSeller: true, sort: 'best_selling'),
              onFeatured: () => _openProducts(title: 'Featured Products', isFeatured: true),
              onAllMedicines: () => _openProducts(),
            ),
          ],
        ),
      ),
    );
  }
}
