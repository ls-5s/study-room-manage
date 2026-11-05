import { createApp } from './app.js';
import { ConfigurationError, loadRuntimeConfig } from './config/env.js';
import { createDatabase } from './config/database.js';
import { createLogger } from './lib/logger.js';

const logger = createLogger();
// Longest time to wait for in-flight requests and the database pool to settle on shutdown.
const SHUTDOWN_TIMEOUT_MS = 9_000;

try {
  const config = loadRuntimeConfig();
  const database = createDatabase(config.database);
  const app = createApp({
    database,
    auth: config.auth,
    corsOrigins: config.corsOrigins,
    logger,
  });

  const server = app.listen(config.port, config.host);
  let stopping = false;

  async function close(exitCode: number) {
    if (stopping) return;
    stopping = true;
    logger.info('server.stopping');

    const forcedExit = setTimeout(() => {
      logger.error('server.shutdown_timeout');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS + 1_000);
    forcedExit.unref();

    try {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeIdleConnections();
      });
      await database.close();
      clearTimeout(forcedExit);
      process.exitCode = exitCode;
    } catch {
      logger.error('server.shutdown_failed');
      server.closeAllConnections();
      process.exit(1);
    }
  }

  server.once('listening', () => {
    logger.info('server.started', { host: config.host, port: config.port });
    // Listening errors are handled above; a later error should go to the default handler
    // instead of silently shutting the server down.
    server.off('error', onListenError);
  });

  function onListenError(error: NodeJS.ErrnoException) {
    logger.error(error.code === 'EADDRINUSE' ? 'server.port_in_use' : 'server.listen_failed', {
      port: config.port,
    });
    void close(1);
  }

  server.once('error', onListenError);

  process.once('SIGINT', () => void close(0));
  process.once('SIGTERM', () => void close(0));
} catch (error) {
  if (error instanceof ConfigurationError) {
    // ConfigurationError only contains the variable name, never its value.
    logger.error('server.configuration_invalid', { message: error.message });
  } else {
    logger.error('server.startup_failed');
  }
  process.exitCode = 1;
}
