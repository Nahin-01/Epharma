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

module.exports = { isConfigured, client, verifySupabaseUser };
