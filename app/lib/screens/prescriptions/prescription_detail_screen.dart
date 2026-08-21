import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../core/formatters.dart';
import '../../models/prescription.dart';
import '../../network/api_client.dart';
import '../../network/api_exception.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/prescription_service.dart';
import '../../widgets/app_button.dart';
import '../auth/login_screen.dart';

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

class PrescriptionDetailScreen extends StatefulWidget {
  final Prescription prescription;

  const PrescriptionDetailScreen({super.key, required this.prescription});

  @override
  State<PrescriptionDetailScreen> createState() => _PrescriptionDetailScreenState();
}

class _PrescriptionDetailScreenState extends State<PrescriptionDetailScreen> {
  final _prescriptionService = PrescriptionService();

  late Prescription _prescription;
  final Map<String, String> _fileUrls = {};
  final _noteController = TextEditingController();
  bool _sendingNote = false;
  bool _refreshing = false;

  @override
  void initState() {
    super.initState();
    _prescription = widget.prescription;
    _loadFileUrls();
    if (_prescription.stillAnalyzing) {
      _pollForOcrResult();
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _loadFileUrls() {
    for (final file in _prescription.files) {
      if (file.id == null) continue;
      _prescriptionService.getSignedFileUrl(_prescription.id, file.id!).then((url) {
        if (mounted) setState(() => _fileUrls[file.id!] = toAbsoluteFileUrl(url));
      }).catchError((_) {});
    }
  }

  /// OCR runs asynchronously on a background worker, so the prescription we
  /// were handed may not have results yet - poll briefly while on this
  /// screen so "Reading your prescription…" resolves without the customer
  /// needing to back out and re-enter.
  Future<void> _pollForOcrResult() async {
    for (var attempt = 0; attempt < 10 && mounted; attempt++) {
      await Future.delayed(const Duration(seconds: 3));
      if (!mounted) return;
      try {
        final updated = await _prescriptionService.getById(_prescription.id);
        if (!mounted) return;
        setState(() => _prescription = updated);
        if (!updated.stillAnalyzing) return;
      } catch (_) {
        return;
      }
    }
  }

  Future<void> _refresh() async {
    setState(() => _refreshing = true);
    try {
      final updated = await _prescriptionService.getById(_prescription.id);
      if (mounted) setState(() => _prescription = updated);
    } catch (_) {
      // Keep showing what we already have.
    } finally {
      if (mounted) setState(() => _refreshing = false);
    }
  }

  Future<void> _sendClarification() async {
    final note = _noteController.text.trim();
    if (note.isEmpty) return;
    setState(() => _sendingNote = true);
    try {
      final updated = await _prescriptionService.addClarification(_prescription.id, note);
      if (mounted) {
        setState(() => _prescription = updated);
        _noteController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Your response has been sent to the pharmacy team.')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not send your response. Please try again.')),
        );
      }
    } finally {
      if (mounted) setState(() => _sendingNote = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _statusColors[_prescription.status] ?? AppColors.slate500;
    final matchedMedicines = _prescription.matchedMedicines;
    final stillAnalyzing = _prescription.stillAnalyzing;

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(
        title: Text('#${_prescription.id.length >= 6 ? _prescription.id.substring(_prescription.id.length - 6).toUpperCase() : _prescription.id}'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(999)),
                child: Text(_statusLabel(_prescription.status), style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Text('Uploaded ${formatDateTime(_prescription.createdAt)}', style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
            const SizedBox(height: 18),
            _sectionLabel('Uploaded files'),
            const SizedBox(height: 8),
            _buildFileGrid(),
            const SizedBox(height: 22),
            _sectionLabel('Medicines detected'),
            const SizedBox(height: 8),
            if (stillAnalyzing && matchedMedicines.isEmpty)
              const Row(
                children: [
                  SizedBox(height: 14, width: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand500)),
                  SizedBox(width: 10),
                  Text('Reading your prescription…', style: TextStyle(fontSize: 13, color: AppColors.slate500)),
                ],
              )
            else if (matchedMedicines.isEmpty)
              const Text('No medicines could be read from this prescription.', style: TextStyle(fontSize: 13, color: AppColors.slate500))
            else
              Column(children: matchedMedicines.map((m) => _MedicineMatchRow(medicine: m)).toList()),
            if (_prescription.reviewerNotes != null) ...[
              const SizedBox(height: 22),
              _sectionLabel('Pharmacist note'),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(12)),
                child: Text(_prescription.reviewerNotes!, style: const TextStyle(fontSize: 13.5, color: AppColors.slate700)),
              ),
            ],
            if (_prescription.clarificationHistory.isNotEmpty) ...[
              const SizedBox(height: 22),
              _sectionLabel('Clarification history'),
              const SizedBox(height: 8),
              Column(
                children: _prescription.clarificationHistory
                    .map((c) => Container(
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: AppColors.accent50, borderRadius: BorderRadius.circular(12)),
                          child: Text(c.note, style: const TextStyle(fontSize: 13.5, color: AppColors.accent700)),
                        ))
                    .toList(),
              ),
            ],
            if (_prescription.status == 'NEEDS_CLARIFICATION') ...[
              const SizedBox(height: 22),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.slate200, style: BorderStyle.solid),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _sectionLabel('Respond to the pharmacy team'),
                    const SizedBox(height: 10),
                    TextField(
                      controller: _noteController,
                      minLines: 3,
                      maxLines: 5,
                      decoration: const InputDecoration(hintText: 'Add the details the pharmacist asked for…'),
                    ),
                    const SizedBox(height: 12),
                    AppButton(
                      label: _sendingNote ? 'Sending…' : 'Send response',
                      loading: _sendingNote,
                      onPressed: _noteController.text.trim().isEmpty ? null : _sendClarification,
                      height: 46,
                    ),
                  ],
                ),
              ),
            ],
            if (_refreshing) ...[
              const SizedBox(height: 16),
              const Center(child: SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2))),
            ],
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.4, color: AppColors.slate400),
    );
  }

  Widget _buildFileGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _prescription.files.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10),
      itemBuilder: (context, index) {
        final file = _prescription.files[index];
        final url = file.id != null ? _fileUrls[file.id!] : null;
        final isImage = file.mimeType?.startsWith('image/') ?? false;
        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Material(
            color: AppColors.slate100,
            child: InkWell(
              onTap: url == null ? null : () => _openFile(url, isImage, file.originalName),
              child: url == null
                  ? const Center(
                      child: SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand400)),
                    )
                  : isImage
                      ? Image.network(url, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.broken_image_outlined, color: AppColors.slate400))
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.description_outlined, color: AppColors.slate500, size: 26),
                            const SizedBox(height: 4),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 4),
                              child: Text(
                                file.originalName ?? 'File',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: const TextStyle(fontSize: 10, color: AppColors.slate500),
                              ),
                            ),
                          ],
                        ),
            ),
          ),
        );
      },
    );
  }

  void _openFile(String url, bool isImage, String? name) {
    if (!isImage) return;
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white, title: Text(name ?? 'Prescription file')),
          body: Center(child: InteractiveViewer(child: Image.network(url))),
        ),
      ),
    );
  }
}

/// One detected medicine line. If the OCR text matched a catalogue product
/// (resolved server-side), offers "Add to bag"; otherwise it's flagged as
/// not carried so the customer knows to ask the pharmacist or search
/// manually. Mirrors MedicineMatchRow in the web app's Prescriptions page.
class _MedicineMatchRow extends StatefulWidget {
  final MatchedMedicine medicine;

  const _MedicineMatchRow({required this.medicine});

  @override
  State<_MedicineMatchRow> createState() => _MedicineMatchRowState();
}

class _MedicineMatchRowState extends State<_MedicineMatchRow> {
  bool _adding = false;

  Future<void> _handleAdd() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    final productId = widget.medicine.productId;
    if (productId == null) return;

    setState(() => _adding = true);
    try {
      await context.read<CartProvider>().addItem(productId, quantity: 1);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.medicine.productName ?? widget.medicine.text} added to bag')),
        );
      }
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not add to bag')));
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final medicine = widget.medicine;
    final label = medicine.productName ?? medicine.text;
    final showSource = medicine.productName != null && medicine.text != medicine.productName;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: AppColors.slate100), borderRadius: BorderRadius.circular(12)),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: AppColors.slate700)),
                if (showSource)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text('from: "${medicine.text}"', maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: AppColors.slate400)),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          if (medicine.productId != null)
            SizedBox(
              height: 32,
              child: AppButton(label: _adding ? 'Adding…' : 'Add to bag', loading: _adding, onPressed: _handleAdd, height: 32),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(color: AppColors.slate200, borderRadius: BorderRadius.circular(999)),
              child: const Text('Not in database', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: AppColors.slate500)),
            ),
        ],
      ),
    );
  }
}
