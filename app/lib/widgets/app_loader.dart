import 'package:flutter/material.dart';

import '../core/app_colors.dart';

class AppLoader extends StatelessWidget {
  final String? label;

  const AppLoader({super.key, this.label});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            height: 30,
            width: 30,
            child: CircularProgressIndicator(strokeWidth: 3, valueColor: AlwaysStoppedAnimation(AppColors.brand600)),
          ),
          if (label != null) ...[
            const SizedBox(height: 12),
            Text(label!, style: const TextStyle(color: AppColors.slate500, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

class QuantityStepper extends StatelessWidget {
  final int quantity;
  final ValueChanged<int> onChanged;
  final bool busy;
  final int min;

  const QuantityStepper({super.key, required this.quantity, required this.onChanged, this.busy = false, this.min = 0});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(border: Border.all(color: AppColors.slate200), borderRadius: BorderRadius.circular(10)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove_rounded,
            onTap: busy ? null : () => onChanged(quantity - 1),
          ),
          SizedBox(
            width: 32,
            child: Text(
              busy ? '…' : '$quantity',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
          _StepButton(
            icon: Icons.add_rounded,
            onTap: busy ? null : () => onChanged(quantity + 1),
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _StepButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Icon(icon, size: 16, color: onTap == null ? AppColors.slate300 : AppColors.slate700),
      ),
    );
  }
}
