import { apiClient, unwrap } from '../lib/apiClient';
import { normalizePhone } from '../lib/format';

const withNormalizedPhone = (payload) =>
  payload?.phone ? { ...payload, phone: normalizePhone(payload.phone) } : payload;

export const authApi = {
  register: (payload) => unwrap(apiClient.post('/auth/register', withNormalizedPhone(payload))),
  login: (payload) => unwrap(apiClient.post('/auth/login', payload)),
  requestOtp: (payload) => unwrap(apiClient.post('/auth/otp/request', withNormalizedPhone(payload))),
  verifyOtp: (payload) => unwrap(apiClient.post('/auth/otp/verify', withNormalizedPhone(payload))),
  logout: () => unwrap(apiClient.post('/auth/logout')),
  changePassword: (payload) => unwrap(apiClient.post('/auth/change-password', payload)),
  forgotPassword: (payload) => unwrap(apiClient.post('/auth/forgot-password', withNormalizedPhone(payload))),
  resetPassword: (payload) => unwrap(apiClient.post('/auth/reset-password', withNormalizedPhone(payload))),
  googleSignIn: (payload) => unwrap(apiClient.post('/auth/google', payload)),
};
