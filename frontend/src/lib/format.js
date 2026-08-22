// Mirrors the backend's Joi phone pattern (backend/src/modules/auth/auth.validation.js)
// so malformed numbers get a clear message here instead of a generic
// "Validation failed" bounce from the server.
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export function isValidPhone(value) {
  return PHONE_PATTERN.test(String(value || '').trim());
}

// Supabase's phone auth (and the backend's OTP/reset flows) both need one
// consistent E.164 string per user - without this, a Bangladeshi number
// typed the natural local way ("01712345678") fails Supabase's phone
// validation outright, and even when it doesn't, a mismatched format would
// silently look up as a different user than the one who registered.
// Mirrors backend/src/integrations/sms/sms.provider.js's toE164.
export function normalizePhone(value) {
  const digits = String(value || '').trim().replace(/[^0-9+]/g, '');
  if (!digits) return digits;
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('880')) return `+${digits}`;
  if (digits.startsWith('0')) return `+880${digits.slice(1)}`;
  return `+880${digits}`;
}

export function formatBDT(amount) {
  const value = Number(amount) || 0;
  return `৳${value.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

export function discountPercent(mrp, sellingPrice) {
  const m = Number(mrp) || 0;
  const s = Number(sellingPrice) || 0;
  if (m <= 0 || s >= m) return 0;
  return Math.round(((m - s) / m) * 100);
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
