import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/app_constants.dart';
import 'core/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/splash/splash_screen.dart';

class EPharmacyApp extends StatelessWidget {
  const EPharmacyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, CartProvider>(
          create: (_) => CartProvider(),
          update: (_, auth, cart) {
            final cartProvider = cart ?? CartProvider();
            cartProvider.onAuthChanged(auth);
            return cartProvider;
          },
        ),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        home: const SplashScreen(),
      ),
    );
  }
}
