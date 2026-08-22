'use strict';

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toList(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: toNumber(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  appName: process.env.APP_NAME || 'ePharmacy',

  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/epharmacy',

  auth: {
    strategy: process.env.AUTH_STRATEGY || 'local',
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    otpExpiresInMinutes: toNumber(process.env.OTP_EXPIRES_IN_MINUTES, 5),
    otpLength: toNumber(process.env.OTP_LENGTH, 6),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },

  jobs: {
    // For a free-tier deploy with no separate background-worker service
    // (e.g. Render's free plan only offers Web Services), this runs the
    // BullMQ workers inside the API server process instead of requiring a
    // second paid deploy. Leave unset when a real separate worker process
    // (`npm run worker`) is running its own deploy.
    runInline: toBool(process.env.RUN_WORKERS_INLINE, false),
  },

  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'prescriptions',
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: toNumber(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },

  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
    doctorUrl: process.env.DOCTOR_URL || 'http://localhost:5175',
    origins: toList(process.env.CORS_ORIGIN, ['http://localhost:5173']),
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER || 'local',
    localPath: process.env.LOCAL_STORAGE_PATH || 'uploads',
    signedUrlExpiresInMinutes: toNumber(process.env.SIGNED_URL_EXPIRES_IN_MINUTES, 15),
    maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 10),
    maxPrescriptionFiles: toNumber(process.env.MAX_PRESCRIPTION_FILES, 5),
  },

  ocr: {
    provider: process.env.OCR_PROVIDER || 'mock',
    apiKey: process.env.OCR_API_KEY || '',
    apiUrl: process.env.OCR_API_URL || '',
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'mock',
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || '',
    senderId: process.env.SMS_SENDER_ID || 'ePharmacy',
    fromNumber: process.env.SMS_FROM_NUMBER || '',
  },

  payments: {
    sslcommerz: {
      storeId: process.env.SSLCOMMERZ_STORE_ID || '',
      storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD || '',
      isLive: toBool(process.env.SSLCOMMERZ_IS_LIVE, false),
    },
    bkash: {
      appKey: process.env.BKASH_APP_KEY || '',
      appSecret: process.env.BKASH_APP_SECRET || '',
      username: process.env.BKASH_USERNAME || '',
      password: process.env.BKASH_PASSWORD || '',
      baseUrl: process.env.BKASH_BASE_URL || '',
    },
    nagad: {
      merchantId: process.env.NAGAD_MERCHANT_ID || '',
      merchantNumber: process.env.NAGAD_MERCHANT_NUMBER || '',
      publicKey: process.env.NAGAD_PUBLIC_KEY || '',
      privateKey: process.env.NAGAD_PRIVATE_KEY || '',
      baseUrl: process.env.NAGAD_BASE_URL || '',
    },
    rocket: {
      merchantId: process.env.ROCKET_MERCHANT_ID || '',
      apiKey: process.env.ROCKET_API_KEY || '',
      apiSecret: process.env.ROCKET_API_SECRET || '',
      baseUrl: process.env.ROCKET_BASE_URL || '',
    },
  },

  courier: {
    provider: process.env.COURIER_PROVIDER || 'mock',
    apiKey: process.env.COURIER_API_KEY || '',
    apiSecret: process.env.COURIER_API_SECRET || '',
    baseUrl: process.env.COURIER_BASE_URL || '',
  },

  logLevel: process.env.LOG_LEVEL || 'debug',

  rateLimit: {
    windowMinutes: toNumber(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
    max: toNumber(process.env.RATE_LIMIT_MAX, 300),
  },

  delivery: {
    defaultCharge: toNumber(process.env.DEFAULT_DELIVERY_CHARGE, 60),
    freeDeliveryThreshold: toNumber(process.env.FREE_DELIVERY_THRESHOLD, 1000),
  },
};

module.exports = env;
