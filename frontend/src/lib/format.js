// Mirrors the backend's Joi phone pattern (backend/src/modules/auth/auth.validation.js)
// so malformed numbers get a clear message here instead of a generic
// "Validation failed" bounce from the server.
const PHONE_PATTERN = /^\+?[0-9]{10,15}$/;

export function isValidPhone(value) {
  return PHONE_PATTERN.test(String(value || '').trim());
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
