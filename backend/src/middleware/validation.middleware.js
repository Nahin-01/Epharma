'use strict';

const ApiError = require('../utils/apiError');

/**
 * Validates req[source] against a Joi schema and replaces it with the
 * sanitized/coerced value. Every module's *.validation.js exports Joi
 * schemas consumed by this middleware, e.g.:
 *   router.post('/', validate(productValidation.createProduct), controller.create)
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    if (!schema) return next();
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      return next(ApiError.badRequest('Validation failed', details));
    }
    req[source] = value;
    return next();
  };
}

const validateBody = (schema) => validate(schema, 'body');
const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = { validate, validateBody, validateQuery, validateParams };
