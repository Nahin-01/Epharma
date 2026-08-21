'use strict';

const crypto = require('crypto');
const env = require('../config/env');

const SECRET = env.auth.accessSecret;

/**
 * Creates a short-lived HMAC signed token for a private storage key so
 * prescription files can be served through a controlled endpoint instead of
 * being publicly reachable. Used by the local storage provider; a real
 * object-storage provider (Supabase/S3) would instead return a native
 * pre-signed URL and this helper would not be needed for that provider.
 */
function createSignedToken(key, expiresInMinutes = env.storage.signedUrlExpiresInMinutes) {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  const payload = `${key}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

function verifySignedToken(key, token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [tokenKey, expiresAt, signature] = parts;
    if (tokenKey !== key) return false;
    if (Date.now() > Number(expiresAt)) return false;
    const expectedPayload = `${tokenKey}:${expiresAt}`;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(expectedPayload)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (err) {
    return false;
  }
}

module.exports = { createSignedToken, verifySignedToken };
