import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../core/validators.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/auth_header.dart';

class OtpLoginScreen extends StatefulWidget {
  static const routeName = '/otp-login';

  const OtpLoginScreen({super.key});

  @override
  State<OtpLoginScreen> createState() => _OtpLoginScreenState();
}

class _OtpLoginScreenState extends State<OtpLoginScreen> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _nameController = TextEditingController();

  bool _codeSent = false;
  bool _submitting = false;
  String? _error;
  String? _info;

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _requestCode() async {
    final phone = _phoneController.text.trim();
    if (!isValidPhone(phone)) {
      setState(() => _error = 'Enter a valid phone number (10-15 digits).');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
      _info = null;
    });
    try {
      final devCode = await context.read<AuthProvider>().requestOtp(phone: phone, purpose: 'LOGIN');
      setState(() {
        _codeSent = true;
        // devCode is only ever set in dev mode (SMS_PROVIDER=mock on the
        // backend), where no SMS is actually sent - see AuthService.requestOtp.
        _info = devCode != null ? 'Dev mode (SMS not actually sent): your code is $devCode' : 'A 6-digit code has been sent to $phone.';
      });
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not send the code. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _verify() async {
    final phone = _phoneController.text.trim();
    final code = _codeController.text.trim();
    if (code.length != 6) {
      setState(() => _error = 'Enter the 6-digit code.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final loggedIn = await context.read<AuthProvider>().verifyOtp(
            phone: phone,
            code: code,
            purpose: 'LOGIN',
            name: _nameController.text.trim(),
          );
      if (loggedIn && mounted) Navigator.of(context).popUntil((route) => route.isFirst);
      if (!loggedIn) setState(() => _error = 'That code did not work. Please try again.');
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not verify the code. Please try again.');
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
            const AuthHeader(title: 'Sign in with OTP', subtitle: "We'll text you a 6-digit code.", height: 210),
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
                      hint: '01712345678',
                      keyboardType: TextInputType.phone,
                      enabled: !_codeSent,
                      prefixIcon: const Icon(Icons.phone_outlined, size: 20),
                    ),
                    if (_codeSent) ...[
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _codeController,
                        label: '6-digit code',
                        keyboardType: TextInputType.number,
                        prefixIcon: const Icon(Icons.pin_outlined, size: 20),
                      ),
                      const SizedBox(height: 14),
                      AppTextField(
                        controller: _nameController,
                        label: 'Name (only needed for a new account)',
                        prefixIcon: const Icon(Icons.badge_outlined, size: 20),
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
                      label: _codeSent ? 'Verify & sign in' : 'Send code',
                      loading: _submitting,
                      onPressed: _codeSent ? _verify : _requestCode,
                    ),
                    if (_codeSent) ...[
                      const SizedBox(height: 10),
                      AppButton(
                        label: 'Resend code',
                        variant: AppButtonVariant.ghost,
                        onPressed: _submitting ? null : _requestCode,
                        height: 40,
                      ),
                    ],
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
