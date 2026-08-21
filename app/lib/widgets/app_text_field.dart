import 'package:flutter/material.dart';

import '../core/app_colors.dart';

class AppTextField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String? hint;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? errorText;
  final Widget? prefixIcon;
  final bool enabled;
  final int maxLines;
  final ValueChanged<String>? onChanged;
  final TextInputAction? textInputAction;

  const AppTextField({
    super.key,
    required this.controller,
    required this.label,
    this.hint,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.errorText,
    this.prefixIcon,
    this.enabled = true,
    this.maxLines = 1,
    this.onChanged,
    this.textInputAction,
  });

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  bool _obscured = true;

  @override
  Widget build(BuildContext context) {
    final isPassword = widget.obscureText;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: AppColors.slate700),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: widget.controller,
          obscureText: isPassword ? _obscured : false,
          keyboardType: widget.keyboardType,
          enabled: widget.enabled,
          maxLines: isPassword ? 1 : widget.maxLines,
          onChanged: widget.onChanged,
          textInputAction: widget.textInputAction,
          style: const TextStyle(fontSize: 15, color: AppColors.slate900),
          decoration: InputDecoration(
            hintText: widget.hint,
            errorText: widget.errorText,
            prefixIcon: widget.prefixIcon,
            suffixIcon: isPassword
                ? IconButton(
                    icon: Icon(
                      _obscured ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      size: 20,
                      color: AppColors.slate400,
                    ),
                    onPressed: () => setState(() => _obscured = !_obscured),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}
