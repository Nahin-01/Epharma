'use strict';

/**
 * Standard application error. Every intentional failure thrown from a
 * service/controller should be an instance of ApiError so the central error
 * middleware can format a consistent JSON response.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null, isOperational = true) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict', details = null) {
    return new ApiError(409, message, details);
  }

  static unprocessable(message = 'Unprocessable entity', details = null) {
    return new ApiError(422, message, details);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, null, false);
  }
}

module.exports = ApiError;
