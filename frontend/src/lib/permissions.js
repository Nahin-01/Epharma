// Client-side mirror of backend/src/constants/permissions.js — used ONLY to
// decide what admin nav items/actions to show. This is a UI convenience,
// not a security boundary: every admin endpoint independently re-checks the
// same permission server-side (see requirePermission in the backend), so a
// user can never do more than what the API actually allows regardless of
// what this file says.
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  ORDER_MANAGER: 'ORDER_MANAGER',
  PHARMACY_MANAGER: 'PHARMACY_MANAGER',
  DOCTOR: 'DOCTOR',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  DELIVERY_MANAGER: 'DELIVERY_MANAGER',
  REPORT_MANAGER: 'REPORT_MANAGER',
  CUSTOMER: 'CUSTOMER',
};

export const PERMISSIONS = {
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_VIEW: 'product:view',
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_UPDATE: 'inventory:update',
  ORDER_VIEW: 'order:view',
  ORDER_UPDATE: 'order:update',
  ORDER_CANCEL: 'order:cancel',
  PRESCRIPTION_VIEW: 'prescription:view',
  PRESCRIPTION_REVIEW: 'prescription:review',
  DOCTOR_CREATE: 'doctor:create',
  DOCTOR_UPDATE: 'doctor:update',
  REPORT_VIEW: 'report:view',
  CUSTOMER_VIEW: 'customer:view',
  CUSTOMER_UPDATE: 'customer:update',
  COUPON_MANAGE: 'coupon:manage',
  DELIVERY_MANAGE: 'delivery:manage',
  PAYMENT_MANAGE: 'payment:manage',
  NOTIFICATION_MANAGE: 'notification:manage',
  ADMIN_MANAGE: 'admin:manage',
  AUDIT_VIEW: 'audit:view',
  SUPPORT_MANAGE: 'support:manage',
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.INVENTORY_MANAGER]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_UPDATE,
    PERMISSIONS.REPORT_VIEW,
  ],
  [ROLES.ORDER_MANAGER]: [
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.DELIVERY_MANAGE,
    PERMISSIONS.REPORT_VIEW,
  ],
  [ROLES.PHARMACY_MANAGER]: [
    PERMISSIONS.PRESCRIPTION_VIEW,
    PERMISSIONS.PRESCRIPTION_REVIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.ORDER_VIEW,
  ],
  [ROLES.CUSTOMER_SUPPORT]: [
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.PRESCRIPTION_VIEW,
    PERMISSIONS.SUPPORT_MANAGE,
  ],
  [ROLES.DELIVERY_MANAGER]: [PERMISSIONS.DELIVERY_MANAGE, PERMISSIONS.ORDER_VIEW, PERMISSIONS.ORDER_UPDATE],
  [ROLES.REPORT_MANAGER]: [PERMISSIONS.REPORT_VIEW, PERMISSIONS.AUDIT_VIEW],
  [ROLES.DOCTOR]: [PERMISSIONS.DOCTOR_UPDATE],
  [ROLES.CUSTOMER]: [],
};

export function resolvePermissions(user) {
  if (!user) return [];
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  const userPerms = user.permissions || [];
  return Array.from(new Set([...rolePerms, ...userPerms]));
}

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN) return true;
  return resolvePermissions(user).includes(permission);
}

export function hasAnyPermission(user, permissionList) {
  return permissionList.some((p) => hasPermission(user, p));
}

// True for any account that isn't a plain shopper — the set of roles that
// should ever see the admin shell at all.
export function isStaff(user) {
  return Boolean(user) && user.role !== ROLES.CUSTOMER;
}
