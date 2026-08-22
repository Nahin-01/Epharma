'use strict';

const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * Thin optional wrapper around the Supabase REST/Auth API using axios so the
 * backend does not hard-depend on @supabase/supabase-js. Only used when
 * AUTH_STRATEGY=supabase or STORAGE_PROVIDER=supabase.
 */
const axios = require('axios');

function isConfigured() {
  return Boolean(env.supabase.url && (env.supabase.serviceRoleKey || env.supabase.anonKey));
}

function client({ useServiceRole = false } = {}) {
  if (!isConfigured()) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and keys in .env');
  }
  const key = useServiceRole ? env.supabase.serviceRoleKey : env.supabase.anonKey;
  return axios.create({
    baseURL: env.supabase.url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    timeout: 10000,
  });
}

/** Confirms `password` is the current password for the given Supabase
 * email/phone identity, the same way Supabase's own password-grant login
 * does. Used to authorize a change-password request for accounts whose real
 * password lives in Supabase, not in this backend's local passwordHash. */
async function verifyPassword(identifier, password) {
  if (!isConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const isEmail = identifier.includes('@');
  try {
    await axios.post(
      `${env.supabase.url}/auth/v1/token`,
      { [isEmail ? 'email' : 'phone']: identifier, password },
      {
        params: { grant_type: 'password' },
        headers: { apikey: env.supabase.anonKey },
        timeout: 8000,
      }
    );
    return true;
  } catch (err) {
    return false;
  }
}

/** Sets a Supabase user's password directly via the admin API. Requires
 * SUPABASE_SERVICE_ROLE_KEY - used by change-password/reset-password so
 * those flows actually update the password Supabase verifies at login,
 * instead of a local field Supabase never looks at. */
async function adminSetPassword(supabaseUserId, password) {
  if (!isConfigured() || !env.supabase.serviceRoleKey) {
    throw new Error('Supabase service role key is not configured');
  }
  await axios.put(
    `${env.supabase.url}/auth/v1/admin/users/${supabaseUserId}`,
    { password },
    {
      headers: {
        apikey: env.supabase.serviceRoleKey,
        Authorization: `Bearer ${env.supabase.serviceRoleKey}`,
      },
      timeout: 10000,
    }
  );
}

async function verifySupabaseUser(accessToken) {
  if (!isConfigured()) {
    throw new Error('Supabase is not configured');
  }
  try {
    const http = axios.create({
      baseURL: env.supabase.url,
      headers: {
        apikey: env.supabase.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 8000,
    });
    const { data } = await http.get('/auth/v1/user');
    return data;
  } catch (err) {
    logger.warn(`Supabase token verification failed: ${err.message}`);
    return null;
  }
}

module.exports = { isConfigured, client, verifySupabaseUser, verifyPassword, adminSetPassword };
