'use strict';

const env = require('../config/env');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new ApiError(400, 'Validation failed', details);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return new ApiError(400, `Invalid value for field "${err.path}"`);
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ApiError(409, `${field} already exists`, err.keyValue);
  }

  // JWT errors that slip through
  if (err.name === 'JsonWebTokenError') return new ApiError(401, 'Invalid token');
  if (err.name === 'TokenExpiredError') return new ApiError(401, 'Token expired');

  return new ApiError(500, err.message || 'Internal server error', null, false);
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, _next) {
  const apiError = normalizeError(err);

  if (!apiError.isOperational || apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${apiError.statusCode} ${apiError.message}`);
  }

  const body = {
    success: false,
    message: apiError.message,
  };
  if (apiError.details) body.errors = apiError.details;
  if (!env.isProduction && apiError.stack) body.stack = apiError.stack;

  res.status(apiError.statusCode || 500).json(body);
}

module.exports = errorMiddleware;
