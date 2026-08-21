'use strict';

/**
 * Strips Mongo operator keys ($gt, $where, ...) and prototype-polluting keys
 * from user-controlled input recursively. Applied as middleware to
 * req.body/query/params.
 */
function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor') {
        continue;
      }
      clean[key] = sanitizeValue(val);
    }
    return clean;
  }
  return value;
}

function sanitizeRequest(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
}

function escapeRegex(text = '') {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { sanitizeValue, sanitizeRequest, escapeRegex };
