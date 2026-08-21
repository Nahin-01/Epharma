'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return ApiResponse.created(res, result, 'Registered successfully');
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return ApiResponse.ok(res, result, 'Logged in successfully');
});

const requestOtp = asyncHandler(async (req, res) => {
  const result = await authService.requestOtp(req.body);
  return ApiResponse.ok(res, result, 'OTP sent successfully');
});

const verifyOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyOtp(req.body);
  return ApiResponse.ok(res, result, 'OTP verified successfully');
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshTokens(req.body.refreshToken);
  return ApiResponse.ok(res, result, 'Token refreshed successfully');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  return ApiResponse.ok(res, null, 'Logged out successfully');
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.id, req.body);
  return ApiResponse.ok(res, result, 'Password changed successfully');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return ApiResponse.ok(res, result, 'Password reset OTP sent');
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.body);
  return ApiResponse.ok(res, result, 'Password reset successfully');
});

const googleSignIn = asyncHandler(async (req, res) => {
  const result = await authService.googleSignIn(req.body);
  return ApiResponse.ok(res, result, 'Signed in with Google successfully');
});

module.exports = {
  register,
  login,
  requestOtp,
  verifyOtp,
  refreshToken,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  googleSignIn,
};
