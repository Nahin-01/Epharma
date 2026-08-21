'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');

const LOCAL_ROOT = path.resolve(process.cwd(), env.storage.localPath);

if (!fs.existsSync(LOCAL_ROOT)) {
  fs.mkdirSync(LOCAL_ROOT, { recursive: true });
}

/**
 * Storage abstraction so prescription files / product images can move
 * between local disk, Supabase Storage or S3-compatible buckets without
 * touching business logic. Files are kept out of MongoDB entirely - only
 * the storage key/reference is persisted on documents.
 */
class LocalStorageProvider {
  constructor() {
    this.root = LOCAL_ROOT;
  }

  async save(buffer, { folder = 'misc', filename } = {}) {
    const dir = path.join(this.root, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const safeName = filename || `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const key = path.posix.join(folder, safeName);
    const fullPath = path.join(this.root, folder, safeName);
    await fs.promises.writeFile(fullPath, buffer);
    return { key, path: fullPath };
  }

  async remove(key) {
    const fullPath = path.join(this.root, key);
    try {
      await fs.promises.unlink(fullPath);
    } catch (err) {
      if (err.code !== 'ENOENT') logger.warn(`Failed to remove file ${key}: ${err.message}`);
    }
  }

  /**
   * Generates a short-lived signed URL. Local dev mode encodes an HMAC token
   * + expiry into the query string; the /files/signed route verifies it.
   * See utils/signedUrl.js for the token implementation.
   */
  async getSignedUrl(key, { expiresInMinutes = env.storage.signedUrlExpiresInMinutes } = {}) {
    const { createSignedToken } = require('../utils/signedUrl');
    const token = createSignedToken(key, expiresInMinutes);
    return `/api/v1/files/signed?key=${encodeURIComponent(key)}&token=${token}`;
  }

  resolvePath(key) {
    return path.join(this.root, key);
  }
}

function getStorageProvider() {
  // Provider is intentionally swappable via STORAGE_PROVIDER. Only "local"
  // is implemented out of the box (no external credentials required); the
  // supabase/s3 providers are stubbed for teams that plug in real buckets.
  switch (env.storage.provider) {
    case 'local':
    default:
      return new LocalStorageProvider();
  }
}

module.exports = { getStorageProvider, LOCAL_ROOT };
