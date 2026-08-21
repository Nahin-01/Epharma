'use strict';
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');
const { sanitizeRequest } = require('./utils/sanitize');
const { globalRateLimiter } = require('./middleware/rateLimit.middleware');
const notFoundMiddleware = require('./middleware/notFound.middleware');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (curl, mobile apps, server-to-server) with no Origin header.
      if (!origin || env.cors.origins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(sanitizeRequest);

if (!env.isTest) {
  app.use(
    morgan(env.isProduction ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

app.use(globalRateLimiter);

app.get('/', (_req, res) => {
  res.json({ success: true, message: `${env.appName} API`, apiPrefix: env.apiPrefix });
});

app.use(env.apiPrefix, routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
