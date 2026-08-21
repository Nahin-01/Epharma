'use strict';

const jwt = require('jsonwebtoken');
const axios = require('axios');
const env = require('../../config/env');
const ApiError = require('../../utils/apiError');
const {
  hashPassword,
  comparePassword,
  generateOtp,
  hashToken,
} = require('../../utils/crypto');
const { recordAudit } = require('../../utils/audit');
const userRepository = require('../users/user.repository');
const { sanitizeUser } = require('../users/user.service');
const { ROLES } = require('../../constants/roles');
const { sendSms } = require('../../integrations/sms/sms.provider');

function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, tokenVersion: user.tokenVersion, type: 'access' },
    env.auth.accessSecret,
    { expiresIn: env.auth.accessExpiresIn }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id), tokenVersion: user.tokenVersion, type: 'refresh' },
    env.auth.refreshSecret,
    { expiresIn: env.auth.refreshExpiresIn }
  );
}

function issueTokens(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
    tokenType: 'Bearer',
  };
}

async function ensureCustomerProfile(user) {
  // Lazy require to avoid a circular dependency at module-load time
  // (customers module does not import auth, but keeping this lazy keeps the
  // dependency direction explicit and easy to reason about).
  const customerService = require('../customers/customer.service');
  await customerService.ensureProfileForUser(user._id);
}

async function register(data) {
  if (data.email) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw ApiError.conflict('An account with this email already exists');
  }
  if (data.phone) {
    const existing = await userRepository.findByPhone(data.phone);
    if (existing) throw ApiError.conflict('An account with this phone number already exists');
  }

  const passwordHash = await hashPassword(data.password);
  const user = await userRepository.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    passwordHash,
    role: ROLES.CUSTOMER,
    isActive: true,
  });

  await ensureCustomerProfile(user);
  await recordAudit({ actorId: user._id, actorRole: user.role, action: 'USER_REGISTERED', entityType: 'User', entityId: user._id });

  const tokens = issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

async function login({ identifier, password }) {
  const user = await userRepository.findByEmailOrPhone(identifier, { withPassword: true });
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const tokens = issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

async function requestOtp({ phone, purpose }) {
  let user = await userRepository.findByPhone(phone, { withPassword: true });

  if (!user && (purpose === 'RESET_PASSWORD' || purpose === 'VERIFY_PHONE')) {
    throw ApiError.notFound('No account found for this phone number');
  }

  if (!user) {
    // LOGIN/REGISTER via OTP: create a shell account that becomes fully
    // active once the code is verified.
    user = await userRepository.create({ phone, role: ROLES.CUSTOMER, isActive: true });
  }

  const code = generateOtp(env.auth.otpLength);
  user.otp = {
    codeHash: hashToken(code),
    purpose,
    expiresAt: new Date(Date.now() + env.auth.otpExpiresInMinutes * 60 * 1000),
    attempts: 0,
  };
  await user.save({ validateBeforeSave: false });

  await sendSms(phone, `Your ePharmacy verification code is ${code}. It expires in ${env.auth.otpExpiresInMinutes} minutes.`);

  // SMS_PROVIDER=mock never actually delivers anything - it only logs the
  // code server-side, which makes the OTP flow untestable end-to-end from
  // either client (frontend or app) without tailing backend logs. Echo the
  // code back only when it truly can't have been delivered for real
  // (mock provider, and never in production) so this stays safe.
  const devCode = !env.isProduction && env.sms.provider === 'mock' ? code : undefined;

  return {
    message: 'OTP sent successfully',
    expiresInMinutes: env.auth.otpExpiresInMinutes,
    ...(devCode ? { devCode } : {}),
  };
}

async function verifyOtp({ phone, code, purpose, name }) {
  const user = await userRepository.findByPhone(phone, { withPassword: true });
  if (!user || !user.otp || !user.otp.codeHash) {
    throw ApiError.badRequest('No OTP request found for this phone number');
  }
  if (user.otp.purpose !== purpose) {
    throw ApiError.badRequest('OTP purpose mismatch');
  }
  if (user.otp.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP has expired, please request a new one');
  }
  if (user.otp.attempts >= 5) {
    throw ApiError.tooManyRequests('Too many incorrect attempts, please request a new OTP');
  }
  if (hashToken(code) !== user.otp.codeHash) {
    user.otp.attempts += 1;
    await user.save({ validateBeforeSave: false });
    throw ApiError.badRequest('Invalid OTP code');
  }

  user.otp = undefined;
  user.isPhoneVerified = true;
  if (name && !user.name) user.name = name;
  if (purpose === 'REGISTER' || purpose === 'LOGIN') {
    user.isActive = true;
    user.lastLoginAt = new Date();
  }
  await user.save({ validateBeforeSave: false });

  if (purpose === 'REGISTER') {
    await ensureCustomerProfile(user);
  }

  if (purpose === 'VERIFY_PHONE') {
    return { verified: true };
  }

  const tokens = issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

async function refreshTokens(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.auth.refreshSecret);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
  if (payload.type !== 'refresh') throw ApiError.unauthorized('Invalid token type');

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer active');
  if (user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized('Session has been invalidated, please log in again');
  }

  return issueTokens(user);
}

async function logout(userId) {
  await userRepository.updateById(userId, { $inc: { tokenVersion: 1 } });
  return { loggedOut: true };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await userRepository.findByIdWithSecrets(userId);
  if (!user) throw ApiError.notFound('User not found');
  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.unauthorized('Current password is incorrect');

  user.passwordHash = await hashPassword(newPassword);
  user.tokenVersion += 1;
  await user.save({ validateBeforeSave: false });

  await recordAudit({ actorId: user._id, actorRole: user.role, action: 'PASSWORD_CHANGED', entityType: 'User', entityId: user._id });

  return issueTokens(user);
}

async function forgotPassword({ phone }) {
  return requestOtp({ phone, purpose: 'RESET_PASSWORD' });
}

async function resetPassword({ phone, code, newPassword }) {
  const user = await userRepository.findByPhone(phone, { withPassword: true });
  if (!user || !user.otp || user.otp.purpose !== 'RESET_PASSWORD') {
    throw ApiError.badRequest('No password reset request found for this phone number');
  }
  if (user.otp.expiresAt < new Date()) {
    throw ApiError.badRequest('OTP has expired, please request a new one');
  }
  if (hashToken(code) !== user.otp.codeHash) {
    user.otp.attempts += 1;
    await user.save({ validateBeforeSave: false });
    throw ApiError.badRequest('Invalid OTP code');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.otp = undefined;
  user.tokenVersion += 1;
  await user.save({ validateBeforeSave: false });

  await recordAudit({ actorId: user._id, actorRole: user.role, action: 'PASSWORD_RESET', entityType: 'User', entityId: user._id });

  return { message: 'Password reset successfully' };
}

async function googleSignIn({ idToken }) {
  if (!env.google.clientId) {
    throw new ApiError(
      501,
      'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in the backend .env to enable it.'
    );
  }
  let payload;
  try {
    const { data } = await axios.get('https://oauth2.googleapis.com/tokeninfo', {
      params: { id_token: idToken },
      timeout: 8000,
    });
    payload = data;
  } catch (err) {
    throw ApiError.unauthorized('Invalid Google ID token');
  }
  if (payload.aud !== env.google.clientId) {
    throw ApiError.unauthorized('Google ID token was not issued for this application');
  }

  let user = await userRepository.findByEmail(payload.email, { withPassword: true });
  if (!user) {
    user = await userRepository.create({
      name: payload.name,
      email: payload.email,
      role: ROLES.CUSTOMER,
      isActive: true,
      isEmailVerified: payload.email_verified === 'true' || payload.email_verified === true,
    });
    await ensureCustomerProfile(user);
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const tokens = issueTokens(user);
  return { user: sanitizeUser(user), ...tokens };
}

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  refreshTokens,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  googleSignIn,
  issueTokens,
};
