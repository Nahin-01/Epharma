import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../root/root_shell.dart';
import '../auth/login_screen.dart';

/// Brief branded splash while AuthProvider checks for a stored session.
/// Navigates on to the app shell (or login) as soon as that resolves —
/// there's no artificial delay.
class SplashScreen extends StatefulWidget {
  static const routeName = '/';

  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 700))..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _navigateNext(AuthProvider auth) {
    final target = auth.isAuthenticated ? const RootShell() : const LoginScreen();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => target));
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (!auth.isLoading) {
          _navigateNext(auth);
        }
        return Scaffold(
          body: Container(
            decoration: const BoxDecoration(gradient: AppColors.heroGradient),
            child: Center(
              child: ScaleTransition(
                scale: CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
                child: FadeTransition(
                  opacity: _controller,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        height: 84,
                        width: 84,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 24, offset: const Offset(0, 10))],
                        ),
                        child: const Icon(Icons.medication_liquid_rounded, color: AppColors.brand600, size: 46),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'ePharmacy',
                        style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: 0.2),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Genuine medicine, delivered',
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
