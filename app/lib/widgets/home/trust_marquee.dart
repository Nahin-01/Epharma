import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

class _TrustItem {
  final IconData icon;
  final String label;

  const _TrustItem({required this.icon, required this.label});
}

const _items = [
  _TrustItem(icon: Icons.local_shipping_outlined, label: 'Same-day delivery in Dhaka'),
  _TrustItem(icon: Icons.shield_outlined, label: '100% genuine medicine'),
  _TrustItem(icon: Icons.how_to_reg_outlined, label: 'Licensed pharmacists'),
  _TrustItem(icon: Icons.lock_outline_rounded, label: 'Secure checkout'),
  _TrustItem(icon: Icons.support_agent_outlined, label: '24/7 support'),
  _TrustItem(icon: Icons.sell_outlined, label: 'Best price guarantee'),
];

/// Mirrors the web app's TrustMarquee (frontend/src/components/home/TrustMarquee.jsx) -
/// a continuously auto-scrolling strip of trust signals, looped seamlessly.
class TrustMarquee extends StatefulWidget {
  const TrustMarquee({super.key});

  @override
  State<TrustMarquee> createState() => _TrustMarqueeState();
}

class _TrustMarqueeState extends State<TrustMarquee> {
  final _controller = ScrollController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(milliseconds: 30), (_) {
      if (!_controller.hasClients) return;
      final max = _controller.position.maxScrollExtent;
      if (max <= 0) return;
      final next = _controller.offset + 0.6;
      _controller.jumpTo(next >= max ? 0 : next);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: SingleChildScrollView(
        controller: _controller,
        scrollDirection: Axis.horizontal,
        physics: const NeverScrollableScrollPhysics(),
        child: Row(children: [_row(), _row()]),
      ),
    );
  }

  Widget _row() {
    return Row(
      children: _items
          .map((item) => Padding(
                padding: const EdgeInsets.only(right: 28),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      height: 28,
                      width: 28,
                      decoration: const BoxDecoration(color: AppColors.brand50, shape: BoxShape.circle),
                      child: Icon(item.icon, size: 14, color: AppColors.brand600),
                    ),
                    const SizedBox(width: 8),
                    Text(item.label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate600)),
                  ],
                ),
              ))
          .toList(),
    );
  }
}
