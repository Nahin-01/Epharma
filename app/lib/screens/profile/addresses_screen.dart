import 'package:flutter/material.dart';

import '../../core/app_colors.dart';
import '../../models/address.dart';
import '../../network/api_exception.dart';
import '../../services/customer_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_loader.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/empty_state.dart';

class AddressesScreen extends StatefulWidget {
  static const routeName = '/addresses';

  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  final _customerService = CustomerService();

  List<Address>? _addresses;
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
      final addresses = await _customerService.listAddresses();
      setState(() => _addresses = addresses);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not load your addresses right now.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _delete(Address address) async {
    if (address.id == null) return;
    try {
      await _customerService.deleteAddress(address.id!);
      _load();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  Future<void> _openForm({Address? existing}) async {
    final result = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddressFormSheet(existing: existing),
    );
    if (result == true) _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('Saved Addresses')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        backgroundColor: AppColors.brand600,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add address'),
      ),
      body: _loading
          ? const AppLoader()
          : _error != null
              ? ErrorState(message: _error!, onRetry: _load)
              : (_addresses == null || _addresses!.isEmpty)
                  ? const EmptyState(
                      icon: Icons.location_on_outlined,
                      title: 'No saved addresses',
                      message: 'Add a delivery address to check out faster next time.',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                      itemCount: _addresses!.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final address = _addresses![index];
                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.slate100)),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${address.name} — ${address.phone}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                                    const SizedBox(height: 4),
                                    Text(address.shortLine, style: const TextStyle(fontSize: 12.5, color: AppColors.slate500)),
                                  ],
                                ),
                              ),
                              IconButton(
                                onPressed: () => _openForm(existing: address),
                                icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.slate500),
                              ),
                              IconButton(
                                onPressed: () => _delete(address),
                                icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.red600),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
    );
  }
}

class _AddressFormSheet extends StatefulWidget {
  final Address? existing;

  const _AddressFormSheet({this.existing});

  @override
  State<_AddressFormSheet> createState() => _AddressFormSheetState();
}

class _AddressFormSheetState extends State<_AddressFormSheet> {
  final _customerService = CustomerService();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _line1Controller;
  late final TextEditingController _areaController;
  late final TextEditingController _districtController;

  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _nameController = TextEditingController(text: existing?.name ?? '');
    _phoneController = TextEditingController(text: existing?.phone ?? '');
    _line1Controller = TextEditingController(text: existing?.line1 ?? '');
    _areaController = TextEditingController(text: existing?.area ?? '');
    _districtController = TextEditingController(text: existing?.district ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _line1Controller.dispose();
    _areaController.dispose();
    _districtController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_nameController.text.trim().isEmpty ||
        _phoneController.text.trim().isEmpty ||
        _line1Controller.text.trim().isEmpty ||
        _districtController.text.trim().isEmpty) {
      setState(() => _error = 'Please fill in all required fields.');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    final address = Address(
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      line1: _line1Controller.text.trim(),
      district: _districtController.text.trim(),
      area: _areaController.text.trim().isEmpty ? null : _areaController.text.trim(),
    );
    try {
      if (widget.existing?.id != null) {
        await _customerService.updateAddress(widget.existing!.id!, address);
      } else {
        await _customerService.addAddress(address);
      }
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not save this address. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24))),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(height: 4, width: 40, margin: const EdgeInsets.only(bottom: 16), decoration: BoxDecoration(color: AppColors.slate200, borderRadius: BorderRadius.circular(4))),
              ),
              Text(widget.existing == null ? 'Add address' : 'Edit address', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              AppTextField(controller: _nameController, label: 'Full name'),
              const SizedBox(height: 12),
              AppTextField(controller: _phoneController, label: 'Phone', keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              AppTextField(controller: _line1Controller, label: 'Address line'),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: AppTextField(controller: _areaController, label: 'Area')),
                  const SizedBox(width: 12),
                  Expanded(child: AppTextField(controller: _districtController, label: 'District')),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(_error!, style: const TextStyle(color: AppColors.red600, fontSize: 12.5)),
              ],
              const SizedBox(height: 18),
              AppButton(label: 'Save address', loading: _submitting, onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}
