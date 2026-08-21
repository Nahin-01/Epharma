import axios from 'axios';
import { supabase } from './supabase';

// Every request/response in this app follows the backend's consistent
// envelope: { success, message, data, meta? } on 2xx, or
// { success:false, message, errors? } on error (see backend
// src/utils/apiResponse.js and src/middleware/error.middleware.js).

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

const ACCESS_TOKEN_KEY = 'epharmacy.accessToken';
const REFRESH_TOKEN_KEY = 'epharmacy.refreshToken';
// Which identity provider issued the current tokens: 'supabase' (password
// login, Google OAuth) or 'local' (this backend's own OTP-login JWTs).
// Needed because Supabase reporting "no session" doesn't mean a local
// session has ended — see AuthContext's onAuthStateChange handler.
const AUTH_PROVIDER_KEY = 'epharmacy.authProvider';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthProvider() {
  return localStorage.getItem(AUTH_PROVIDER_KEY);
}

export function setTokens({ accessToken, refreshToken, provider } = {}) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (provider) localStorage.setItem(AUTH_PROVIDER_KEY, provider);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_PROVIDER_KEY);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Listeners the AuthContext can subscribe to so it learns immediately when a
// silent refresh fails and the user needs to be signed out.
const sessionExpiredListeners = new Set();
export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

let refreshPromise = null;

async function refreshAccessToken() {
  // Password-login and Google-OAuth sessions are issued by Supabase, not by
  // this backend, so they must be refreshed through Supabase directly — the
  // backend's /auth/refresh-token endpoint only verifies locally-issued
  // (OTP-login) JWTs and will always reject a Supabase refresh token.
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    const tokens = { accessToken: data.session.access_token, refreshToken: data.session.refresh_token };
    setTokens(tokens);
    return tokens;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  // Use a bare axios call (not apiClient) to avoid recursively triggering
  // the response interceptor below.
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
  setTokens(data.data);
  return data.data;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (response && response.status === 401 && !config._retried && !config.url?.includes('/auth/')) {
      config._retried = true;
      try {
        if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
        const tokens = await refreshPromise;
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(config);
      } catch (refreshError) {
        clearTokens();
        sessionExpiredListeners.forEach((listener) => listener());
        return Promise.reject(normalizeError(error));
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export function normalizeError(error) {
  if (error.response) {
    const body = error.response.data || {};
    const err = new Error(body.message || 'Something went wrong. Please try again.');
    err.status = error.response.status;
    err.errors = body.errors;
    return err;
  }
  if (error.request) {
    const err = new Error('Could not reach the server. Please check your connection and try again.');
    err.status = 0;
    return err;
  }
  return error;
}

// Local-storage signed file URLs come back relative to the backend
// (/api/v1/files/signed?...) since that's all the storage provider knows
// about. A cloud storage provider (S3/Supabase) would return an
// already-absolute https:// URL. Either way, this makes it safe to drop
// straight into an <img src>/<a href> regardless of which one it is.
export function toAbsoluteFileUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, API_BASE_URL).href;
}

// Small helper so call sites can just do `const data = await unwrap(apiClient.get(...))`
export async function unwrap(promise) {
  const res = await promise;
  return res.data.data;
}

export async function unwrapFull(promise) {
  const res = await promise;
  return { data: res.data.data, meta: res.data.meta, message: res.data.message };
}
