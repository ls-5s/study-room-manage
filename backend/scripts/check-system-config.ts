import { ConfigurationError, loadRuntimeConfig } from '../src/config/env.js';

try {
  const config = loadRuntimeConfig();
  console.info(
    JSON.stringify(
      {
        host: config.host,
        port: config.port,
        nodeEnv: config.nodeEnv,
        corsOrigins: config.corsOrigins,
        logLevel: config.logLevel,
        trustProxy: config.trustProxy,
        jobsEnabled: config.jobsEnabled,
        database: {
          host: config.database.host,
          port: config.database.port,
          name: config.database.name,
          user: config.database.user,
        },
        auth: {
          jwtSecretConfigured: true,
          checkInSigningSecretConfigured: true,
          tokenTtlSeconds: config.auth.tokenTtlSeconds,
          bcryptCost: config.auth.bcryptCost,
        },
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(
    error instanceof ConfigurationError ? `配置无效：${error.message}` : '系统配置检查失败。',
  );
  process.exitCode = 1;
}
