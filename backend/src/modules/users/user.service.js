'use strict';

const userRepository = require('./user.repository');
const ApiError = require('../../utils/apiError');
const { hashPassword } = require('../../utils/crypto');
const { recordAudit } = require('../../utils/audit');
const { escapeRegex } = require('../../utils/sanitize');

async function createStaffUser(data, actor) {
  const existing = await userRepository.findByEmail(data.email);
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const passwordHash = await hashPassword(data.password);
  const user = await userRepository.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    role: data.role,
    permissions: data.permissions || [],
    isActive: true,
    isEmailVerified: true,
  });

  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'STAFF_USER_CREATED',
    entityType: 'User',
    entityId: user._id,
    changes: { role: data.role },
  });

  return sanitizeUser(user);
}

async function listUsers({ page, limit, role, search }) {
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const { items, meta } = await userRepository.list({ filter, page, limit });
  return { items: items.map(sanitizeUser), meta };
}

async function getUserById(id) {
  const user = await userRepository.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return sanitizeUser(user);
}

async function updateUser(id, data, actor) {
  const user = await userRepository.updateById(id, data);
  if (!user) throw ApiError.notFound('User not found');
  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: user._id,
    changes: data,
  });
  return sanitizeUser(user);
}

async function deactivateUser(id, actor) {
  const user = await userRepository.updateById(id, { isActive: false, $inc: { tokenVersion: 1 } });
  if (!user) throw ApiError.notFound('User not found');
  await recordAudit({
    actorId: actor?.id,
    actorRole: actor?.role,
    action: 'USER_DEACTIVATED',
    entityType: 'User',
    entityId: user._id,
  });
  return sanitizeUser(user);
}

function sanitizeUser(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete obj.passwordHash;
  delete obj.otp;
  return obj;
}

module.exports = {
  createStaffUser,
  listUsers,
  getUserById,
  updateUser,
  deactivateUser,
  sanitizeUser,
};
