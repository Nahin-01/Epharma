import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../providers/cart_provider.dart';
import '../cart/cart_screen.dart';
import '../catalog/product_list_screen.dart';
import '../home/home_screen.dart';
import '../orders/orders_screen.dart';
import '../profile/profile_screen.dart';

/// Bottom-nav shell that hosts the five main tabs. Each tab keeps its own
/// state alive via IndexedStack so switching tabs doesn't re-fetch data.
class RootShell extends StatefulWidget {
  static const routeName = '/app';

  const RootShell({super.key});

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _index = 0;

  static const _tabs = [
    HomeScreen(),
    ProductListScreen(),
    CartScreen(),
    OrdersScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final itemCount = context.watch<CartProvider>().cart.itemCount;

    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (index) => setState(() => _index = index),
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home_rounded), label: 'Home'),
          const BottomNavigationBarItem(icon: Icon(Icons.grid_view_outlined), activeIcon: Icon(Icons.grid_view_rounded), label: 'Shop'),
          BottomNavigationBarItem(
            icon: _CartIcon(count: itemCount, active: false),
            activeIcon: _CartIcon(count: itemCount, active: true),
            label: 'Bag',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.receipt_long_outlined), activeIcon: Icon(Icons.receipt_long_rounded), label: 'Orders'),
          const BottomNavigationBarItem(icon: Icon(Icons.person_outline_rounded), activeIcon: Icon(Icons.person_rounded), label: 'Profile'),
        ],
      ),
    );
  }
}

class _CartIcon extends StatelessWidget {
  final int count;
  final bool active;

  const _CartIcon({required this.count, required this.active});

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(active ? Icons.shopping_bag_rounded : Icons.shopping_bag_outlined),
        if (count > 0)
          Positioned(
            top: -4,
            right: -8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(color: AppColors.accent500, borderRadius: BorderRadius.circular(999)),
              constraints: const BoxConstraints(minWidth: 16),
              child: Text(
                count > 99 ? '99+' : '$count',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w700),
              ),
            ),
          ),
      ],
    );
  }
}
