'use strict';

const Joi = require('joi');

const phone = Joi.string().pattern(/^\+?[0-9]{10,15}$/);
const password = Joi.string().min(8).max(128);

const register = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  phone: phone.optional(),
  password: password.required(),
})
  .or('email', 'phone')
  .messages({ 'object.missing': 'Either email or phone is required' });

const login = Joi.object({
  identifier: Joi.string().required().messages({ 'any.required': 'Email or phone is required' }),
  password: password.required(),
});

const requestOtp = Joi.object({
  phone: phone.required(),
  purpose: Joi.string().valid('LOGIN', 'REGISTER', 'RESET_PASSWORD', 'VERIFY_PHONE').default('LOGIN'),
});

const verifyOtp = Joi.object({
  phone: phone.required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  purpose: Joi.string().valid('LOGIN', 'REGISTER', 'RESET_PASSWORD', 'VERIFY_PHONE').default('LOGIN'),
  name: Joi.string().min(2).max(100).optional(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: password.required(),
  newPassword: password.required(),
});

const forgotPassword = Joi.object({
  phone: phone.required(),
});

const resetPassword = Joi.object({
  phone: phone.required(),
  code: Joi.string().length(6).pattern(/^[0-9]+$/).required(),
  newPassword: password.required(),
});

const googleSignIn = Joi.object({
  idToken: Joi.string().required(),
});

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  googleSignIn,
};
