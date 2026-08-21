import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../services/prescription_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/empty_state.dart';
import '../auth/login_screen.dart';
import 'prescription_detail_screen.dart';

class UploadPrescriptionScreen extends StatefulWidget {
  static const routeName = '/upload-prescription';

  const UploadPrescriptionScreen({super.key});

  @override
  State<UploadPrescriptionScreen> createState() => _UploadPrescriptionScreenState();
}

class _UploadPrescriptionScreenState extends State<UploadPrescriptionScreen> {
  final _prescriptionService = PrescriptionService();
  final _picker = ImagePicker();

  final List<XFile> _files = [];
  bool _uploading = false;
  String? _error;

  Future<void> _pickFromCamera() async {
    final file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (file != null) setState(() => _files.add(file));
  }

  Future<void> _pickFromGallery() async {
    final files = await _picker.pickMultiImage(imageQuality: 85);
    if (files.isNotEmpty) setState(() => _files.addAll(files));
  }

  Future<void> _upload() async {
    if (_files.isEmpty) {
      setState(() => _error = 'Add at least one photo of your prescription.');
      return;
    }
    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      final prescription = await _prescriptionService.upload(_files.map((f) => f.path).toList());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Prescription uploaded — reading your medicines now…')),
        );
        Navigator.of(context)
            .pushReplacement(MaterialPageRoute(builder: (_) => PrescriptionDetailScreen(prescription: prescription)));
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not upload your prescription. Please try again.');
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('Upload Prescription')),
      body: !auth.isAuthenticated
          ? EmptyState(
              icon: Icons.description_outlined,
              title: 'Sign in to upload a prescription',
              message: 'A licensed pharmacist reviews every prescription before your order ships.',
              actionLabel: 'Sign in',
              onAction: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen())),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(14)),
                  child: const Row(
                    children: [
                      Icon(Icons.verified_user_outlined, color: AppColors.brand600),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Upload a clear photo of your prescription. A licensed pharmacist reviews it before your medicine ships.',
                          style: TextStyle(fontSize: 12.5, color: AppColors.brand700, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Expanded(
                      child: AppButton(
                        label: 'Take photo',
                        icon: Icons.camera_alt_outlined,
                        variant: AppButtonVariant.outline,
                        onPressed: _pickFromCamera,
                        height: 56,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppButton(
                        label: 'From gallery',
                        icon: Icons.photo_library_outlined,
                        variant: AppButtonVariant.outline,
                        onPressed: _pickFromGallery,
                        height: 56,
                      ),
                    ),
                  ],
                ),
                if (_files.isNotEmpty) ...[
                  const SizedBox(height: 18),
                  Text('${_files.length} photo${_files.length == 1 ? '' : 's'} selected', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _files.asMap().entries.map((entry) {
                      final index = entry.key;
                      final file = entry.value;
                      return Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(File(file.path), height: 90, width: 90, fit: BoxFit.cover),
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () => setState(() => _files.removeAt(index)),
                              child: Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                child: const Icon(Icons.close_rounded, color: Colors.white, size: 14),
                              ),
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ],
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  Text(_error!, style: const TextStyle(color: AppColors.red600, fontSize: 12.5)),
                ],
                const SizedBox(height: 22),
                AppButton(label: 'Upload prescription', loading: _uploading, onPressed: _upload),
              ],
            ),
    );
  }
}
