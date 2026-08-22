'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
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

  async getBuffer(key) {
    return fs.promises.readFile(this.resolvePath(key));
  }
}

/**
 * Supabase Storage-backed provider - the one that actually survives a
 * redeploy/restart, unlike LocalStorageProvider's disk (which is wiped on
 * most hosts, including Render's free/standard web services). Uses the
 * service-role key so it can read/write a private bucket directly via
 * Supabase's Storage REST API without needing the supabase-js SDK.
 */
class SupabaseStorageProvider {
  constructor() {
    if (!env.supabase.url || !env.supabase.serviceRoleKey) {
      throw new Error('STORAGE_PROVIDER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    this.bucket = env.supabase.storageBucket;
    this.base = `${env.supabase.url}/storage/v1`;
    this.headers = {
      apikey: env.supabase.serviceRoleKey,
      Authorization: `Bearer ${env.supabase.serviceRoleKey}`,
    };
  }

  async save(buffer, { folder = 'misc', filename, contentType } = {}) {
    const safeName = filename || `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const key = path.posix.join(folder, safeName);
    await axios.post(`${this.base}/object/${this.bucket}/${key}`, buffer, {
      headers: { ...this.headers, 'Content-Type': contentType || 'application/octet-stream' },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    return { key };
  }

  async remove(key) {
    try {
      await axios.delete(`${this.base}/object/${this.bucket}/${key}`, { headers: this.headers });
    } catch (err) {
      logger.warn(`Failed to remove Supabase file ${key}: ${err.message}`);
    }
  }

  /** Mirrors LocalStorageProvider.getSignedUrl's contract but returns a real
   * Supabase-hosted signed URL instead of routing through /files/signed. */
  async getSignedUrl(key, { expiresInMinutes = env.storage.signedUrlExpiresInMinutes } = {}) {
    const { data } = await axios.post(
      `${this.base}/object/sign/${this.bucket}/${key}`,
      { expiresIn: expiresInMinutes * 60 },
      { headers: this.headers }
    );
    return `${env.supabase.url}/storage/v1${data.signedURL}`;
  }

  async getBuffer(key) {
    const { data } = await axios.get(`${this.base}/object/${this.bucket}/${key}`, {
      headers: this.headers,
      responseType: 'arraybuffer',
    });
    return Buffer.from(data);
  }
}

function getStorageProvider() {
  // Provider is intentionally swappable via STORAGE_PROVIDER: "local" needs
  // no external credentials but its disk doesn't survive a redeploy/restart
  // on most hosts, so anything meant to run in production should use
  // "supabase" once SUPABASE_STORAGE_BUCKET exists as a private bucket.
  switch (env.storage.provider) {
    case 'supabase':
      return new SupabaseStorageProvider();
    case 'local':
    default:
      return new LocalStorageProvider();
  }
}

module.exports = { getStorageProvider, LOCAL_ROOT };
