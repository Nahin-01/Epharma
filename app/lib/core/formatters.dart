import 'package:intl/intl.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_BD', symbol: '৳', decimalDigits: 0);
final _dateFormat = DateFormat('d MMM yyyy');
final _dateTimeFormat = DateFormat('d MMM yyyy, h:mm a');

String formatBDT(num amount) => _currencyFormat.format(amount);

String formatDate(DateTime? date) => date == null ? '—' : _dateFormat.format(date);

String formatDateTime(DateTime? date) => date == null ? '—' : _dateTimeFormat.format(date);
