import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/app_colors.dart';
import '../network/api_exception.dart';
import '../providers/auth_provider.dart';

/// Mirrors the web app's "Continue with Google" button, backed by the same
/// Supabase Google provider (see AuthService.googleSignIn and
/// SupabaseAuthClient). Requires this Android app's package name + SHA-1 to
/// be registered under the same Google Cloud project as GOOGLE_CLIENT_ID
/// (see app/README.md) - without that, Google's picker will fail to return
/// an ID token and the button surfaces that as a snackbar.
class GoogleButton extends StatefulWidget {
  final String label;

  const GoogleButton({super.key, this.label = 'Continue with Google'});

  @override
  State<GoogleButton> createState() => _GoogleButtonState();
}

class _GoogleButtonState extends State<GoogleButton> {
  bool _loading = false;

  Future<void> _handleTap() async {
    setState(() => _loading = true);
    try {
      final signedIn = await context.read<AuthProvider>().googleSignIn();
      if (signedIn && mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Google sign-in failed. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 52,
      child: OutlinedButton(
        onPressed: _loading ? null : _handleTap,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppColors.slate200, width: 1.4),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.slate700,
        ),
        child: _loading
            ? const SizedBox(
                height: 18,
                width: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.slate400),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const _GoogleGlyph(),
                  const SizedBox(width: 10),
                  Text(widget.label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                ],
              ),
      ),
    );
  }
}

class _GoogleGlyph extends StatelessWidget {
  const _GoogleGlyph();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 18,
      width: 18,
      child: CustomPaint(painter: _GoogleGPainter()),
    );
  }
}

/// Hand-drawn four-color "G" so the button doesn't depend on a bundled
/// image asset.
class _GoogleGPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final radius = size.width / 2;
    final center = Offset(radius, radius);
    final strokeWidth = size.width * 0.22;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.butt;

    final rect = Rect.fromCircle(center: center, radius: radius - strokeWidth / 2);

    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(rect, -0.35, 1.7, false, paint);

    paint.color = const Color(0xFF34A853);
    canvas.drawArc(rect, 1.35, 1.55, false, paint);

    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(rect, 2.9, 1.1, false, paint);

    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(rect, 4.0, 1.5, false, paint);

    final barPaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;
    canvas.drawRect(
      Rect.fromLTWH(center.dx, center.dy - strokeWidth / 2, radius - strokeWidth * 0.3, strokeWidth),
      barPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
