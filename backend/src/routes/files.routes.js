'use strict';

const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifySignedToken } = require('../utils/signedUrl');
const { getStorageProvider } = require('../config/storage');

/**
 * Serves a private file (prescription upload, etc.) after validating a
 * short-lived HMAC-signed token. This is the local-storage equivalent of a
 * cloud provider's pre-signed URL (see config/storage.js).
 */
router.get(
  '/signed',
  asyncHandler(async (req, res) => {
    const { key, token } = req.query;
    if (!key || !token) throw ApiError.badRequest('Missing key or token');
    if (!verifySignedToken(String(key), String(token))) {
      throw ApiError.unauthorized('Invalid or expired file link');
    }

    const storage = getStorageProvider();
    const fullPath = storage.resolvePath(String(key));
    const normalizedRoot = path.resolve(storage.root);
    const normalizedPath = path.resolve(fullPath);
    if (!normalizedPath.startsWith(normalizedRoot)) {
      throw ApiError.badRequest('Invalid file path');
    }
    if (!fs.existsSync(normalizedPath)) {
      throw ApiError.notFound('File not found');
    }
    return res.sendFile(normalizedPath);
  })
);

module.exports = router;
