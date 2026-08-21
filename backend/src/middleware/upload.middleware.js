'use strict';

const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/apiError');

const storage = multer.memoryStorage();

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PRESCRIPTION_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

function fileFilterFactory(allowedMimeTypes) {
  return (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
    }
    return cb(null, true);
  };
}

const uploadImage = multer({
  storage,
  limits: { fileSize: env.storage.maxFileSizeMb * 1024 * 1024 },
  fileFilter: fileFilterFactory(IMAGE_TYPES),
});

const uploadPrescription = multer({
  storage,
  limits: {
    fileSize: env.storage.maxFileSizeMb * 1024 * 1024,
    files: env.storage.maxPrescriptionFiles,
  },
  fileFilter: fileFilterFactory(PRESCRIPTION_TYPES),
});

/** Normalizes multer errors into ApiError so the central handler formats them. */
function handleUploadErrors(uploadMiddleware) {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return next(ApiError.badRequest(`Upload error: ${err.message}`));
      }
      return next(err);
    });
  };
}

module.exports = {
  uploadImage,
  uploadPrescription,
  handleUploadErrors,
};
