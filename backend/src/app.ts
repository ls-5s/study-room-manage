import cors from 'cors';
import express from 'express';
import type { AuthConfig } from './config/env.js';
import type { Database } from './config/database.js';
import { createLogger } from './lib/logger.js';
import type { Logger } from './lib/logger.js';
import { requestContext } from './lib/request-context.js';
import { accessLog } from './middleware/access-log.js';
import { errorHandler, HttpError, notFound } from './middleware/errors.js';
import { securityHeaders } from './middleware/security-headers.js';
import { createApiRouter } from './routes/index.js';

export interface AppDependencies {
  database: Database;
  auth: AuthConfig;
  logger?: Logger;
  corsOrigins?: readonly string[];
  nodeEnv?: 'development' | 'production' | 'test';
  trustProxy?: number;
  jobsEnabled?: boolean;
}

// Creating/importing the app does not read .env, open a DB connection, listen, or register signals.
export function createApp(dependencies: AppDependencies) {
  const app = express();
  const logger = dependencies.logger ?? createLogger();
  const allowedOrigins = new Set(dependencies.corsOrigins ?? []);
  app.disable('x-powered-by');
  app.set('trust proxy', dependencies.trustProxy ?? 0);

  app.use(requestContext);
  app.use(securityHeaders({ production: dependencies.nodeEnv === 'production' }));
  app.use(accessLog(logger));

  app.use(
    cors({
      origin(origin, callback) {
        if (origin === undefined || allowedOrigins.has(origin)) callback(null, true);
        else callback(new HttpError(403, 'FORBIDDEN', '请求来源不被允许'));
      },
    }),
  );
  app.use(express.json({ limit: '256kb' }));
  const api = createApiRouter({
    database: dependencies.database,
    auth: dependencies.auth,
    logger,
    nodeEnv: dependencies.nodeEnv ?? 'development',
    trustProxy: dependencies.trustProxy ?? 0,
    jobsEnabled: dependencies.jobsEnabled ?? true,
  });
  app.use('/api/v1', api.router);
  // The HTTP server owns the lifecycle of background jobs; the app only exposes them.
  app.locals.jobs = api.jobs;

  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}
