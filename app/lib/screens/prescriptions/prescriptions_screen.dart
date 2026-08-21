import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../core/formatters.dart';
import '../../models/prescription.dart';
import '../../network/api_exception.dart';
import '../../services/prescription_service.dart';
import '../../widgets/app_loader.dart';
import '../../widgets/empty_state.dart';
import 'prescription_detail_screen.dart';
import 'upload_prescription_screen.dart';

const Map<String, Color> _statusColors = {
  'UPLOADED': AppColors.slate500,
  'UNDER_REVIEW': AppColors.amber600,
  'VERIFIED': AppColors.brand600,
  'NEEDS_CLARIFICATION': AppColors.accent600,
  'ACCEPTED': AppColors.emerald600,
  'REJECTED': AppColors.red600,
  'FULFILLED': AppColors.emerald600,
};

String _statusLabel(String status) {
  return status
      .split('_')
      .map((word) => word.isEmpty ? word : '${word[0]}${word.substring(1).toLowerCase()}')
      .join(' ');
}

class PrescriptionsScreen extends StatefulWidget {
  static const routeName = '/prescriptions';

  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  final _prescriptionService = PrescriptionService();

  List<Prescription>? _prescriptions;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final page = await _prescriptionService.listMine(limit: 20);
      setState(() => _prescriptions = page.items);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not load your prescriptions right now.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('My Prescriptions')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UploadPrescriptionScreen())),
        backgroundColor: AppColors.brand600,
        icon: const Icon(Icons.upload_file_rounded),
        label: const Text('Upload'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const AppLoader();
    if (_error != null) return ErrorState(message: _error!, onRetry: _load);
    if (_prescriptions == null || _prescriptions!.isEmpty) {
      return EmptyState(
        icon: Icons.description_outlined,
        title: 'No prescriptions yet',
        message: 'Upload a prescription and a licensed pharmacist will review it.',
        actionLabel: 'Upload now',
        onAction: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UploadPrescriptionScreen())),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
        itemCount: _prescriptions!.length,
        separatorBuilder: (context, index) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final prescription = _prescriptions![index];
          final color = _statusColors[prescription.status] ?? AppColors.slate500;
          return Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            child: InkWell(
              borderRadius: BorderRadius.circular(14),
              onTap: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => PrescriptionDetailScreen(prescription: prescription)))
                  .then((_) => _load()),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.slate100)),
                child: Row(
                  children: [
                    Container(
                      height: 48,
                      width: 48,
                      decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.description_outlined, color: AppColors.brand600),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${prescription.files.length} file${prescription.files.length == 1 ? '' : 's'}',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                          ),
                          const SizedBox(height: 3),
                          Text('Uploaded ${formatDate(prescription.createdAt)}', style: const TextStyle(fontSize: 11.5, color: AppColors.slate500)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                      child: Text(_statusLabel(prescription.status), style: TextStyle(color: color, fontSize: 10.5, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.slate300, size: 20),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
