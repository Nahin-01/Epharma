'use strict';
// const dns = require('dns');
// dns.setServers(['8.8.8.8', '1.1.1.1']);

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/database');

let server;

async function start() {
  try {
    await connectDB();
  } catch (err) {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    logger.error('Server will continue starting so /health reports a clear "degraded" status instead of crash-looping.');
  }

  if (env.jobs.runInline) {
    try {
      const { startWorkers } = require('./jobs/worker');
      await startWorkers();
      logger.info('Background workers started in-process (RUN_WORKERS_INLINE=true)');
    } catch (err) {
      logger.error(`Failed to start in-process workers: ${err.message}`);
    }
  }

  server = app.listen(env.port, () => {
    logger.info(`${env.appName} backend listening on port ${env.port} [${env.nodeEnv}]`);
    logger.info(`API base: http://localhost:${env.port}${env.apiPrefix}`);
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason instanceof Error ? reason.stack : reason}`);
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.stack || err.message}`);
  process.exit(1);
});

start();

module.exports = app;
