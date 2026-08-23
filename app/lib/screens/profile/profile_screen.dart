import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../admin/admin_panel_screen.dart';
import '../auth/login_screen.dart';
import '../orders/orders_screen.dart';
import '../prescriptions/prescriptions_screen.dart';
import 'addresses_screen.dart';

/// Mirrors the web app's isStaff check (lib/permissions.js) — any role other
/// than CUSTOMER gets the admin dashboard entry point.
bool _isStaff(String role) => role != 'CUSTOMER';

class ProfileScreen extends StatelessWidget {
  static const routeName = '/profile';

  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: AppColors.slate50,
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.person_outline_rounded, size: 56, color: AppColors.slate300),
                const SizedBox(height: 16),
                const Text('Sign in to manage your profile', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                const SizedBox(height: 18),
                AppButton(
                  label: 'Sign in',
                  onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final user = auth.user!;

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(gradient: AppColors.heroGradient, borderRadius: BorderRadius.circular(20)),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white,
                  child: Text(user.initials, style: const TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w800, fontSize: 18)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user.displayName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
                      const SizedBox(height: 3),
                      if (user.email != null) Text(user.email!, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12.5)),
                      if (user.phone != null) Text(user.phone!, style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 12.5)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          _MenuTile(
            icon: Icons.receipt_long_outlined,
            label: 'My Orders',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const OrdersScreen())),
          ),
          _MenuTile(
            icon: Icons.description_outlined,
            label: 'My Prescriptions',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PrescriptionsScreen())),
          ),
          _MenuTile(
            icon: Icons.location_on_outlined,
            label: 'Saved Addresses',
            onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AddressesScreen())),
          ),
          if (_isStaff(user.role))
            _MenuTile(
              icon: Icons.admin_panel_settings_outlined,
              label: 'Admin Panel',
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const AdminPanelScreen())),
            ),
          const SizedBox(height: 18),
          AppButton(
            label: 'Sign out',
            variant: AppButtonVariant.outline,
            onPressed: () async {
              await context.read<AuthProvider>().logout();
            },
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _MenuTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.slate100)),
      child: ListTile(
        onTap: onTap,
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.brand600, size: 20),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
        trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.slate300),
      ),
    );
  }
}
