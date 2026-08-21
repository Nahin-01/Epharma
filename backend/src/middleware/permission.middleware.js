'use strict';

const ApiError = require('../utils/apiError');
const { ROLES } = require('../constants/roles');
const { ROLE_PERMISSIONS } = require('../constants/permissions');

function resolvePermissions(user) {
  if (!user) return [];
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  const userPerms = user.permissions || [];
  return Array.from(new Set([...rolePerms, ...userPerms]));
}

/**
 * Fine-grained RBAC + permission check, layered on top of requireRole.
 * SUPER_ADMIN bypasses every check. Usage:
 *   router.post('/', requirePermission(PERMISSIONS.PRODUCT_CREATE), handler)
 */
function requirePermission(...requiredPermissions) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (req.user.role === ROLES.SUPER_ADMIN) return next();

    const granted = resolvePermissions(req.user);
    const hasAll = requiredPermissions.every((p) => granted.includes(p));
    if (!hasAll) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };
}

module.exports = { requirePermission, resolvePermissions };
