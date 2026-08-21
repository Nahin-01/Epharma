import 'package:flutter/material.dart';

import '../core/app_colors.dart';
import 'app_button.dart';

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(color: AppColors.brand50, shape: BoxShape.circle),
            child: Icon(icon, size: 40, color: AppColors.brand500),
          ),
          const SizedBox(height: 20),
          Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.slate800)),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13.5, color: AppColors.slate500, height: 1.4),
          ),
          if (actionLabel != null && onAction != null) ...[
            const SizedBox(height: 20),
            AppButton(label: actionLabel!, onPressed: onAction, height: 46),
          ],
        ],
      ),
    );
  }
}

class ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const ErrorState({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return EmptyState(
      icon: Icons.wifi_off_rounded,
      title: 'Something went wrong',
      message: message,
      actionLabel: 'Try again',
      onAction: onRetry,
    );
  }
}
