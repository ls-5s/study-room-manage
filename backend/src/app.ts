import cors from 'cors';
import express from 'express';
import type { AuthConfig } from './config/env.js';
import type { Database } from './config/database.js';
import { createLogger } from './lib/logger.js';
import type { Logger } from './lib/logger.js';
import { errorHandler, HttpError, notFound } from './middleware/errors.js';
import { createApiRouter } from './routes/index.js';

export interface AppDependencies {
  database: Database;
  auth: AuthConfig;
  logger?: Logger;
  corsOrigins?: readonly string[];
}

// Creating/importing the app does not read .env, open a DB connection, listen, or register signals.
export function createApp(dependencies: AppDependencies) {
  const app = express();
  const logger = dependencies.logger ?? createLogger();
  const allowedOrigins = new Set(dependencies.corsOrigins ?? []);
  app.disable('x-powered-by');

  app.use((request, response, next) => {
    const started = performance.now();
    response.once('finish', () => {
      logger.info('request.completed', {
        method: request.method,
        statusCode: response.statusCode,
        durationMs: Math.round(performance.now() - started),
      });
    });
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (origin === undefined || allowedOrigins.has(origin)) callback(null, true);
        else callback(new HttpError(403, 'FORBIDDEN', '请求来源不被允许'));
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  const api = createApiRouter({
    probeDatabase: dependencies.database.probe,
    database: dependencies.database,
    auth: dependencies.auth,
    logger,
  });
  app.use('/api/v1', api.router);
  // The HTTP server owns the lifecycle of background jobs; the app only exposes them.
  app.locals.reservationJob = api.reservationJob;

  app.use(notFound);
  app.use(errorHandler(logger));
  return app;
}
