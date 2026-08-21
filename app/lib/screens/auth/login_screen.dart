import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/auth_header.dart';
import '../../widgets/google_button.dart';
import '../root/root_shell.dart';
import 'forgot_password_screen.dart';
import 'otp_login_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  static const routeName = '/login';

  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_identifierController.text.trim().isEmpty || _passwordController.text.isEmpty) {
      setState(() => _error = 'Please enter your email/phone and password.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().login(_identifierController.text.trim(), _passwordController.text);
      if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not sign in. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      resizeToAvoidBottomInset: true,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AuthHeader(title: 'Welcome back', subtitle: 'Sign in to order medicine and track your prescriptions.'),
            Transform.translate(
              offset: const Offset(0, -28),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 18),
                padding: const EdgeInsets.fromLTRB(20, 26, 20, 24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: AppColors.slate900.withValues(alpha: 0.06), blurRadius: 30, offset: const Offset(0, 12)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppTextField(
                      controller: _identifierController,
                      label: 'Email or phone',
                      hint: 'you@example.com or 01712345678',
                      keyboardType: TextInputType.emailAddress,
                      prefixIcon: const Icon(Icons.person_outline_rounded, size: 20),
                    ),
                    const SizedBox(height: 16),
                    AppTextField(
                      controller: _passwordController,
                      label: 'Password',
                      obscureText: true,
                      prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: AppColors.red600, fontSize: 12.5)),
                    ],
                    const SizedBox(height: 20),
                    AppButton(label: 'Sign in', loading: _submitting, onPressed: _submit),
                    const SizedBox(height: 14),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const OtpLoginScreen()),
                          ),
                          child: const Text('Sign in with OTP', style: TextStyle(fontSize: 12.5)),
                        ),
                        TextButton(
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const ForgotPasswordScreen()),
                          ),
                          child: const Text('Forgot password?', style: TextStyle(fontSize: 12.5, color: AppColors.slate500)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Row(
                      children: [
                        Expanded(child: Divider()),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 12),
                          child: Text('OR', style: TextStyle(color: AppColors.slate400, fontSize: 11, fontWeight: FontWeight.w700)),
                        ),
                        Expanded(child: Divider()),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const GoogleButton(),
                    const SizedBox(height: 14),
                    TextButton(
                      onPressed: () => Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => const RootShell()),
                        (route) => false,
                      ),
                      child: const Text(
                        'Continue as guest',
                        style: TextStyle(fontSize: 12.5, color: AppColors.slate500, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text("New here? ", style: TextStyle(color: AppColors.slate500, fontSize: 13.5)),
                        GestureDetector(
                          onTap: () => Navigator.of(context).pushReplacement(
                            MaterialPageRoute(builder: (_) => const RegisterScreen()),
                          ),
                          child: const Text(
                            'Create an account',
                            style: TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w700, fontSize: 13.5),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
