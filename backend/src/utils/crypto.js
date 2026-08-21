'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function comparePassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i += 1) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateOrderNumber(prefix = 'ORD') {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generateCode(prefix, length = 8) {
  const rand = crypto.randomBytes(length).toString('hex').toUpperCase().slice(0, length);
  return prefix ? `${prefix}-${rand}` : rand;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateOtp,
  hashToken,
  generateRandomToken,
  generateOrderNumber,
  generateCode,
};
