'use strict';

const router = require('express').Router();
const controller = require('./auth.controller');
const validation = require('./auth.validation');
const { authenticate } = require('../../middleware/auth.middleware');
const { validateBody } = require('../../middleware/validation.middleware');
const { authRateLimiter, otpRateLimiter } = require('../../middleware/rateLimit.middleware');

router.post('/register', authRateLimiter, validateBody(validation.register), controller.register);
router.post('/login', authRateLimiter, validateBody(validation.login), controller.login);
router.post('/google', authRateLimiter, validateBody(validation.googleSignIn), controller.googleSignIn);

router.post('/otp/request', otpRateLimiter, validateBody(validation.requestOtp), controller.requestOtp);
router.post('/otp/verify', authRateLimiter, validateBody(validation.verifyOtp), controller.verifyOtp);

router.post('/refresh-token', validateBody(validation.refreshToken), controller.refreshToken);
router.post('/forgot-password', otpRateLimiter, validateBody(validation.forgotPassword), controller.forgotPassword);
router.post('/reset-password', authRateLimiter, validateBody(validation.resetPassword), controller.resetPassword);

router.post('/logout', authenticate, controller.logout);
router.post('/change-password', authenticate, validateBody(validation.changePassword), controller.changePassword);

module.exports = router;
