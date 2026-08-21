'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const ApiError = require('../src/utils/apiError');
const { getPagination, buildMeta } = require('../src/utils/pagination');
const { createSignedToken, verifySignedToken } = require('../src/utils/signedUrl');
const { escapeRegex, sanitizeValue } = require('../src/utils/sanitize');
const { generateOtp, generateOrderNumber, hashToken } = require('../src/utils/crypto');
const {
  ORDER_STATUS,
  ORDER_STATUS_TRANSITIONS,
  PRESCRIPTION_STATUS,
  PRESCRIPTION_STATUS_TRANSITIONS,
} = require('../src/constants/orderStatus');

test('ApiError factory helpers set the right status codes', () => {
  assert.equal(ApiError.badRequest().statusCode, 400);
  assert.equal(ApiError.unauthorized().statusCode, 401);
  assert.equal(ApiError.forbidden().statusCode, 403);
  assert.equal(ApiError.notFound().statusCode, 404);
  assert.equal(ApiError.conflict().statusCode, 409);
  assert.equal(ApiError.internal().statusCode, 500);
});

test('getPagination clamps and defaults page/limit', () => {
  assert.deepEqual(getPagination({}), { page: 1, limit: 20, skip: 0 });
  assert.deepEqual(getPagination({ page: '2', limit: '10' }), { page: 2, limit: 10, skip: 10 });
  assert.deepEqual(getPagination({ page: -1, limit: 500 }), { page: 1, limit: 100, skip: 0 });
});

test('buildMeta computes totalPages and hasNext/PrevPage', () => {
  const meta = buildMeta({ page: 2, limit: 10, total: 25 });
  assert.equal(meta.totalPages, 3);
  assert.equal(meta.hasNextPage, true);
  assert.equal(meta.hasPrevPage, true);
});

test('signed token round-trips and rejects tampering', () => {
  const token = createSignedToken('prescriptions/abc/file.pdf', 5);
  assert.equal(verifySignedToken('prescriptions/abc/file.pdf', token), true);
  assert.equal(verifySignedToken('prescriptions/other/file.pdf', token), false);
  assert.equal(verifySignedToken('prescriptions/abc/file.pdf', `${token}tampered`), false);
});

test('sanitizeValue strips mongo operators and prototype keys', () => {
  const clean = sanitizeValue({ name: 'x', $where: 'evil', nested: { $gt: 1, ok: 2 }, __proto__: {} });
  assert.deepEqual(clean, { name: 'x', nested: { ok: 2 } });
});

test('escapeRegex escapes special characters', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
});

test('generateOtp produces numeric string of requested length', () => {
  const otp = generateOtp(6);
  assert.equal(otp.length, 6);
  assert.match(otp, /^[0-9]{6}$/);
});

test('generateOrderNumber has expected prefix', () => {
  assert.match(generateOrderNumber(), /^ORD-/);
});

test('hashToken is deterministic', () => {
  assert.equal(hashToken('abc'), hashToken('abc'));
  assert.notEqual(hashToken('abc'), hashToken('abd'));
});

test('order status transitions disallow skipping states', () => {
  assert.ok(ORDER_STATUS_TRANSITIONS[ORDER_STATUS.PENDING].includes(ORDER_STATUS.CONFIRMED));
  assert.ok(!ORDER_STATUS_TRANSITIONS[ORDER_STATUS.PENDING].includes(ORDER_STATUS.DELIVERED));
  assert.deepEqual(ORDER_STATUS_TRANSITIONS[ORDER_STATUS.CANCELLED], []);
});

test('prescription status transitions follow the documented workflow', () => {
  assert.ok(
    PRESCRIPTION_STATUS_TRANSITIONS[PRESCRIPTION_STATUS.UPLOADED].includes(PRESCRIPTION_STATUS.UNDER_REVIEW)
  );
  assert.ok(
    PRESCRIPTION_STATUS_TRANSITIONS[PRESCRIPTION_STATUS.UNDER_REVIEW].includes(PRESCRIPTION_STATUS.VERIFIED)
  );
  assert.deepEqual(PRESCRIPTION_STATUS_TRANSITIONS[PRESCRIPTION_STATUS.REJECTED], []);
});
