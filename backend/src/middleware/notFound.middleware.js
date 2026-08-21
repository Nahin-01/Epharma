'use strict';

const ApiError = require('../utils/apiError');

function notFoundMiddleware(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFoundMiddleware;
