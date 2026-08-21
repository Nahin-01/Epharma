'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { verifySupabaseUser } = require('../config/supabase');

function extractToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

function verifyLocalToken(token) {
  try {
    return jwt.verify(token, env.auth.accessSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token expired');
    }
    throw ApiError.unauthorized('Invalid access token');
  }
}

/** Same as verifyLocalToken but never throws - used to probe a token before
 * committing to the local-auth code path. */
function tryVerifyLocalToken(token) {
  try {
    return jwt.verify(token, env.auth.accessSecret);
  } catch (err) {
    return null;
  }
}

async function resolveLocalUser(payload) {
  const User = require('../modules/users/user.model');
  if (payload.type && payload.type !== 'access') {
    throw ApiError.unauthorized('Invalid token type');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');
  if (user.tokenVersion !== undefined && payload.tokenVersion !== undefined) {
    if (user.tokenVersion !== payload.tokenVersion) {
      throw ApiError.unauthorized('Session has been invalidated, please log in again');
    }
  }
  return user;
}

async function resolveSupabaseUser(token) {
  const User = require('../modules/users/user.model');
  const supabaseUser = await verifySupabaseUser(token);
  if (!supabaseUser || !supabaseUser.id) {
    return null;
  }
  const metadata = supabaseUser.user_metadata || {};
  let user = await User.findOne({
    $or: [
      { supabaseId: supabaseUser.id },
      ...(supabaseUser.email ? [{ email: supabaseUser.email.toLowerCase() }] : []),
    ],
  });
  if (!user) {
    user = await User.create({
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      phone: supabaseUser.phone,
      name: metadata.full_name || metadata.name,
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: Boolean(supabaseUser.email_confirmed_at),
    });
  } else {
    user.supabaseId = supabaseUser.id;
    if (supabaseUser.email) user.email = supabaseUser.email;
    if (supabaseUser.phone) user.phone = supabaseUser.phone;
    if (!user.name && (metadata.full_name || metadata.name)) user.name = metadata.full_name || metadata.name;
    if (supabaseUser.email_confirmed_at) user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });
  }
  if (user.role === 'CUSTOMER') {
    const customerService = require('../modules/customers/customer.service');
    await customerService.ensureProfileForUser(user._id);
  }
  return user;
}

/**
 * Resolves the authenticated identity for a request. Two kinds of tokens
 * can arrive here, and both are accepted regardless of env.auth.strategy:
 *  - local: signed by this backend's own auth module (used by /auth/login,
 *    /auth/register, /auth/otp/verify, and the Flutter app end to end).
 *  - Supabase: issued by Supabase Auth (used by the web app's email/password
 *    and Google OAuth flows).
 * env.auth.strategy just picks which one is *preferred* so the common case
 * verifies without an extra network round-trip; when it's "supabase" a local
 * token is still tried first since it's free to check and lets the OTP/
 * Flutter flows keep working without every client needing to move to
 * Supabase. The rest of the codebase only ever sees req.user with a
 * normalized shape.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized('Authentication token is required');
  }

  if (env.auth.strategy !== 'supabase') {
    const user = await resolveLocalUser(verifyLocalToken(token));
    req.user = normalizeUser(user);
    return next();
  }

  const localPayload = tryVerifyLocalToken(token);
  if (localPayload) {
    const user = await resolveLocalUser(localPayload);
    req.user = normalizeUser(user);
    return next();
  }

  const supabaseUser = await resolveSupabaseUser(token);
  if (!supabaseUser) {
    throw ApiError.unauthorized('Invalid or expired session');
  }
  req.user = normalizeUser(supabaseUser);
  return next();
});

/**
 * Same as authenticate but does not fail when no token is present - used on
 * public endpoints that behave slightly differently for logged-in users
 * (e.g. personalised product listing).
 */
const optionalAuthenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    logger.debug(`optionalAuthenticate: ignoring invalid token (${err.message})`);
  }
  return next();
});

function normalizeUser(userDoc) {
  return {
    id: String(userDoc._id),
    email: userDoc.email,
    phone: userDoc.phone,
    role: userDoc.role,
    permissions: userDoc.permissions || [],
    isActive: userDoc.isActive,
    doc: userDoc,
  };
}

module.exports = { authenticate, optionalAuthenticate };
