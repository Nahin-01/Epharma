import { apiClient, unwrap } from '../lib/apiClient';

export const authApi = {
  register: (payload) => unwrap(apiClient.post('/auth/register', payload)),
  login: (payload) => unwrap(apiClient.post('/auth/login', payload)),
  requestOtp: (payload) => unwrap(apiClient.post('/auth/otp/request', payload)),
  verifyOtp: (payload) => unwrap(apiClient.post('/auth/otp/verify', payload)),
  logout: () => unwrap(apiClient.post('/auth/logout')),
  changePassword: (payload) => unwrap(apiClient.post('/auth/change-password', payload)),
  forgotPassword: (payload) => unwrap(apiClient.post('/auth/forgot-password', payload)),
  resetPassword: (payload) => unwrap(apiClient.post('/auth/reset-password', payload)),
  googleSignIn: (payload) => unwrap(apiClient.post('/auth/google', payload)),
};
