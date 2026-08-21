'use strict';

const dns = require('dns');
const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

// The local router's DNS relay doesn't answer Node's c-ares SRV/A queries
// (mongodb+srv:// lookups fail with ECONNREFUSED) even though the OS
// resolver handles them fine. Point Node's resolver at a public DNS server
// so the Atlas SRV lookup succeeds regardless of the network's router.
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.set('strictQuery', true);

let connected = false;

async function connectDB() {
  if (connected) return mongoose.connection;

  mongoose.connection.on('connected', () => {
    logger.info(`MongoDB connected -> ${maskUri(env.mongodbUri)}`);
  });
  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 8000,
  });

  connected = true;
  return mongoose.connection;
}

async function disconnectDB() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

function maskUri(uri) {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  } catch (e) {
    return uri;
  }
}

module.exports = { connectDB, disconnectDB, mongoose };
