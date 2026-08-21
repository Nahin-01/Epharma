import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/app_colors.dart';
import '../../core/app_constants.dart';
import '../../core/formatters.dart';
import '../../models/address.dart';
import '../../models/prescription.dart';
import '../../network/api_exception.dart';
import '../../providers/cart_provider.dart';
import '../../services/customer_service.dart';
import '../../services/delivery_service.dart';
import '../../services/order_service.dart';
import '../../services/prescription_service.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_loader.dart';
import '../../widgets/app_text_field.dart';
import '../orders/order_detail_screen.dart';
import '../prescriptions/upload_prescription_screen.dart';

class CheckoutScreen extends StatefulWidget {
  static const routeName = '/checkout';

  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _customerService = CustomerService();
  final _deliveryService = DeliveryService();
  final _orderService = OrderService();
  final _prescriptionService = PrescriptionService();

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _line1Controller = TextEditingController();
  final _areaController = TextEditingController();
  final _districtController = TextEditingController();

  List<Address> _addresses = [];
  bool _loadingAddresses = true;
  String? _selectedAddressId;
  bool _useNewAddress = false;

  String _deliveryType = 'STANDARD';
  String _paymentMethod = 'COD';
  double _deliveryCharge = 0;
  bool _resolvingCharge = false;
  bool _submitting = false;
  String? _error;

  List<Prescription> _acceptedPrescriptions = [];
  String? _selectedPrescriptionId;
  bool _loadingPrescriptions = false;
  bool _prescriptionsRequested = false;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAcceptedPrescriptions() async {
    if (_prescriptionsRequested) return;
    _prescriptionsRequested = true;
    setState(() => _loadingPrescriptions = true);
    try {
      final page = await _prescriptionService.listMine(limit: 20, status: 'ACCEPTED');
      if (mounted) setState(() => _acceptedPrescriptions = page.items);
    } catch (_) {
      // Leave the list empty — the "upload one" prompt still guides the customer.
    } finally {
      if (mounted) setState(() => _loadingPrescriptions = false);
    }
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

  Future<void> _loadAddresses() async {
    setState(() => _loadingAddresses = true);
    try {
      final addresses = await _customerService.listAddresses();
      setState(() {
        _addresses = addresses;
        if (addresses.isNotEmpty) {
          _selectedAddressId = addresses.first.id;
          _resolveCharge(addresses.first.district, addresses.first.area);
        } else {
          _useNewAddress = true;
        }
      });
    } catch (_) {
      setState(() => _useNewAddress = true);
    } finally {
      if (mounted) setState(() => _loadingAddresses = false);
    }
  }

  Address? get _selectedSavedAddress {
    if (_selectedAddressId == null) return null;
    for (final address in _addresses) {
      if (address.id == _selectedAddressId) return address;
    }
    return null;
  }

  Future<void> _resolveCharge(String district, String? area) async {
    if (district.trim().isEmpty) return;
    setState(() => _resolvingCharge = true);
    try {
      final charge = await _deliveryService.resolveCharge(district: district, area: area);
      setState(() => _deliveryCharge = _deliveryType == 'EXPRESS' ? charge * 2 : charge);
    } catch (_) {
      // Keep last known charge — the backend still authoritatively computes
      // the final total at checkout.
    } finally {
      if (mounted) setState(() => _resolvingCharge = false);
    }
  }

  Future<void> _submit() async {
    final cart = context.read<CartProvider>().cart;
    Address? addressToSend;

    if (cart.requiresPrescription && _selectedPrescriptionId == null) {
      setState(() => _error = 'This order needs a reviewed prescription. Please select one below.');
      return;
    }

    if (_useNewAddress) {
      if (_nameController.text.trim().isEmpty ||
          _phoneController.text.trim().isEmpty ||
          _line1Controller.text.trim().isEmpty ||
          _districtController.text.trim().isEmpty) {
        setState(() => _error = 'Please fill in name, phone, address line and district.');
        return;
      }
      addressToSend = Address(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        line1: _line1Controller.text.trim(),
        district: _districtController.text.trim(),
        area: _areaController.text.trim().isEmpty ? null : _areaController.text.trim(),
      );
    } else if (_selectedAddressId == null) {
      setState(() => _error = 'Please choose a delivery address.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final order = await _orderService.checkout(
        CheckoutPayload(
          addressId: _useNewAddress ? null : _selectedAddressId,
          address: addressToSend,
          deliveryType: _deliveryType,
          paymentMethod: _paymentMethod,
          couponCode: cart.couponCode,
          prescriptionId: _selectedPrescriptionId,
        ),
      );
      if (mounted) {
        await context.read<CartProvider>().refresh();
      }
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: order.id, justPlaced: true)),
        );
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = 'Could not place your order. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _buildPrescriptionSection() {
    if (_loadingPrescriptions) {
      return const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: AppLoader());
    }
    if (_acceptedPrescriptions.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.slate200)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'This order contains prescription-required medicines, but you have no pharmacist-accepted prescription yet.',
              style: TextStyle(fontSize: 12.5, color: AppColors.slate600, height: 1.4),
            ),
            const SizedBox(height: 10),
            AppButton(
              label: 'Upload a prescription',
              variant: AppButtonVariant.outline,
              height: 40,
              onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UploadPrescriptionScreen())),
            ),
          ],
        ),
      );
    }
    return Column(
      children: _acceptedPrescriptions.map((p) {
        final selected = _selectedPrescriptionId == p.id;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            onTap: () => setState(() => _selectedPrescriptionId = p.id),
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: selected ? AppColors.brand500 : AppColors.slate200, width: selected ? 1.6 : 1),
              ),
              child: Row(
                children: [
                  Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                      color: selected ? AppColors.brand600 : AppColors.slate300, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Prescription #${p.id.length >= 6 ? p.id.substring(p.id.length - 6).toUpperCase() : p.id} — ${p.files.length} file(s)',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>().cart;
    final freeDelivery = cart.subtotal >= AppConstants.freeDeliveryThreshold && _deliveryType == 'STANDARD';
    final effectiveDeliveryCharge = freeDelivery ? 0 : _deliveryCharge;
    final estimatedTotal = cart.subtotal - cart.couponDiscount + effectiveDeliveryCharge;

    if (cart.requiresPrescription && !_prescriptionsRequested) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _loadAcceptedPrescriptions());
    }

    return Scaffold(
      backgroundColor: AppColors.slate50,
      appBar: AppBar(title: const Text('Checkout')),
      body: _loadingAddresses
          ? const AppLoader()
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 130),
              children: [
                const Text('Delivery address', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                const SizedBox(height: 10),
                ..._addresses.map(
                  (address) => _AddressOption(
                    address: address,
                    selected: !_useNewAddress && _selectedAddressId == address.id,
                    onTap: () {
                      setState(() {
                        _useNewAddress = false;
                        _selectedAddressId = address.id;
                      });
                      _resolveCharge(address.district, address.area);
                    },
                  ),
                ),
                _NewAddressOption(
                  selected: _useNewAddress,
                  onTap: () => setState(() => _useNewAddress = true),
                ),
                if (_useNewAddress) ...[
                  const SizedBox(height: 12),
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
                      Expanded(
                        child: AppTextField(
                          controller: _districtController,
                          label: 'District',
                          onChanged: (value) => _resolveCharge(value, _areaController.text),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 22),
                const Text('Delivery speed', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: _ChoiceCard(
                        label: 'Standard',
                        sublabel: 'Next day',
                        selected: _deliveryType == 'STANDARD',
                        onTap: () {
                          setState(() => _deliveryType = 'STANDARD');
                          final addr = _selectedSavedAddress;
                          if (addr != null) _resolveCharge(addr.district, addr.area);
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _ChoiceCard(
                        label: 'Express',
                        sublabel: 'Same day',
                        selected: _deliveryType == 'EXPRESS',
                        onTap: () {
                          setState(() => _deliveryType = 'EXPRESS');
                          final addr = _selectedSavedAddress;
                          if (addr != null) _resolveCharge(addr.district, addr.area);
                        },
                      ),
                    ),
                  ],
                ),
                if (cart.requiresPrescription) ...[
                  const SizedBox(height: 22),
                  const Text('Prescription', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                  const SizedBox(height: 10),
                  _buildPrescriptionSection(),
                ],
                const SizedBox(height: 22),
                const Text('Payment method', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.slate800)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _PaymentChip(label: 'Cash on Delivery', value: 'COD', selected: _paymentMethod, onSelect: (v) => setState(() => _paymentMethod = v)),
                    _PaymentChip(label: 'bKash', value: 'BKASH', selected: _paymentMethod, onSelect: (v) => setState(() => _paymentMethod = v)),
                    _PaymentChip(label: 'Nagad', value: 'NAGAD', selected: _paymentMethod, onSelect: (v) => setState(() => _paymentMethod = v)),
                    _PaymentChip(label: 'Rocket', value: 'ROCKET', selected: _paymentMethod, onSelect: (v) => setState(() => _paymentMethod = v)),
                    _PaymentChip(label: 'Card', value: 'CARD', selected: _paymentMethod, onSelect: (v) => setState(() => _paymentMethod = v)),
                  ],
                ),
                const SizedBox(height: 22),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.slate100)),
                  child: Column(
                    children: [
                      _SummaryLine(label: 'Subtotal', value: formatBDT(cart.subtotal)),
                      if (cart.couponDiscount > 0) _SummaryLine(label: 'Coupon discount', value: '-${formatBDT(cart.couponDiscount)}'),
                      _SummaryLine(
                        label: 'Delivery charge',
                        value: _resolvingCharge ? '…' : (freeDelivery ? 'Free' : formatBDT(effectiveDeliveryCharge)),
                      ),
                      const Divider(height: 20),
                      _SummaryLine(label: 'Estimated total', value: formatBDT(estimatedTotal), bold: true),
                    ],
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 14),
                  Text(_error!, style: const TextStyle(color: AppColors.red600, fontSize: 12.5)),
                ],
              ],
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          child: AppButton(label: 'Place order', loading: _submitting, onPressed: _loadingAddresses ? null : _submit),
        ),
      ),
    );
  }
}

class _AddressOption extends StatelessWidget {
  final Address address;
  final bool selected;
  final VoidCallback onTap;

  const _AddressOption({required this.address, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: selected ? AppColors.brand500 : AppColors.slate200, width: selected ? 1.6 : 1),
          ),
          child: Row(
            children: [
              Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                  color: selected ? AppColors.brand600 : AppColors.slate300, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${address.name} — ${address.phone}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    const SizedBox(height: 2),
                    Text(address.shortLine, style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NewAddressOption extends StatelessWidget {
  final bool selected;
  final VoidCallback onTap;

  const _NewAddressOption({required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? AppColors.brand500 : AppColors.slate200, width: selected ? 1.6 : 1),
        ),
        child: Row(
          children: [
            Icon(selected ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
                color: selected ? AppColors.brand600 : AppColors.slate300, size: 20),
            const SizedBox(width: 12),
            const Text('Use a new address', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class _ChoiceCard extends StatelessWidget {
  final String label;
  final String sublabel;
  final bool selected;
  final VoidCallback onTap;

  const _ChoiceCard({required this.label, required this.sublabel, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: selected ? AppColors.brand50 : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? AppColors.brand500 : AppColors.slate200, width: selected ? 1.6 : 1),
        ),
        child: Column(
          children: [
            Text(label, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: selected ? AppColors.brand700 : AppColors.slate800)),
            const SizedBox(height: 2),
            Text(sublabel, style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
          ],
        ),
      ),
    );
  }
}

class _PaymentChip extends StatelessWidget {
  final String label;
  final String value;
  final String selected;
  final ValueChanged<String> onSelect;

  const _PaymentChip({required this.label, required this.value, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final isSelected = value == selected;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onSelect(value),
      selectedColor: AppColors.brand600,
      backgroundColor: Colors.white,
      side: BorderSide(color: isSelected ? AppColors.brand600 : AppColors.slate200),
      labelStyle: TextStyle(color: isSelected ? Colors.white : AppColors.slate700, fontWeight: FontWeight.w600, fontSize: 12.5),
    );
  }
}

class _SummaryLine extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;

  const _SummaryLine({required this.label, required this.value, this.bold = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: bold ? 15 : 13, color: AppColors.slate500, fontWeight: bold ? FontWeight.w700 : FontWeight.w500)),
          Text(value, style: TextStyle(fontSize: bold ? 17 : 13.5, fontWeight: bold ? FontWeight.w800 : FontWeight.w600, color: bold ? AppColors.brand700 : AppColors.slate800)),
        ],
      ),
    );
  }
}
