'use strict';

const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');

/**
 * Restricts a route to one or more roles. SUPER_ADMIN always passes.
 * Usage: router.get('/', requireRole(ROLES.ADMIN, ROLES.ORDER_MANAGER), handler)
 */
function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (req.user.role === ROLES.SUPER_ADMIN) return next();
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have the required role for this action'));
    }
    return next();
  };
}

module.exports = { requireRole };
