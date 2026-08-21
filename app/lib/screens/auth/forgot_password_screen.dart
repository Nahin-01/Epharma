import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../core/validators.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/auth_header.dart';

class ForgotPasswordScreen extends StatefulWidget {
  static const routeName = '/forgot-password';

  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _newPasswordController = TextEditingController();

  bool _resetStep = false;
  bool _submitting = false;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    if (!isValidPhone(_phoneController.text.trim())) {
      setState(() => _error = 'Enter a valid phone number (10-15 digits).');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
      _info = null;
    });
    try {
      final devCode = await context.read<AuthProvider>().forgotPassword(_phoneController.text.trim());
      setState(() {
        _resetStep = true;
        // Only set in dev mode (SMS_PROVIDER=mock on the backend), where no
        // SMS is actually sent - see AuthService.forgotPassword.
        _info = devCode != null ? 'Dev mode (SMS not actually sent): your code is $devCode' : null;
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not send the reset code. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _resetPassword() async {
    if (_codeController.text.trim().length != 6) {
      setState(() => _error = 'Enter the 6-digit code.');
      return;
    }
    if (_newPasswordController.text.length < 8) {
      setState(() => _error = 'Password must be at least 8 characters.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().resetPassword(
            phone: _phoneController.text.trim(),
            code: _codeController.text.trim(),
            newPassword: _newPasswordController.text,
          );
      if (mounted) Navigator.of(context).pop();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not reset your password. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const AuthHeader(title: 'Reset your password', subtitle: "We'll send a code to your phone.", height: 210),
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
                      controller: _phoneController,
                      label: 'Phone number',
                      keyboardType: TextInputType.phone,
                      enabled: !_resetStep,
                      prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                    ),
                    if (_resetStep) ...[
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _codeController,
                        label: '6-digit code',
                        keyboardType: TextInputType.number,
                        prefixIcon: const Icon(Icons.pin_outlined, size: 20),
                      ),
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _newPasswordController,
                        label: 'New password',
                        obscureText: true,
                        prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
                      ),
                    ],
                    if (_info != null) ...[
                      const SizedBox(height: 12),
                      Text(_info!, style: const TextStyle(color: AppColors.brand700, fontSize: 12.5)),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: AppColors.red600, fontSize: 12.5)),
                    ],
                    const SizedBox(height: 20),
                    AppButton(
                      label: _resetStep ? 'Reset password' : 'Send reset code',
                      loading: _submitting,
                      onPressed: _resetStep ? _resetPassword : _requestCode,
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
