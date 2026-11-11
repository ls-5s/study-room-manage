import assert from 'node:assert/strict';
import test from 'node:test';
import { ConfigurationError, readConfig } from '../src/config/env.js';
import { createLogger } from '../src/lib/logger.js';
import { createDynamicUserRateLimiter } from '../src/lib/user-rate-limit.js';
import { currentRequestId, requestContext } from '../src/lib/request-context.js';
import { securityHeaders } from '../src/middleware/security-headers.js';
import { validateOperationalSettings } from '../src/services/operational-settings.service.js';

const baseEnv = {
  JWT_SECRET: 'a'.repeat(40),
  DB_NAME: 'study_room_manage',
  DB_USER: 'study_room_app',
  DB_PASSWORD: 'password',
} as NodeJS.ProcessEnv;

test('运行配置解析日志、代理和任务开关', () => {
  const config = readConfig({
    ...baseEnv,
    LOG_LEVEL: 'debug',
    TRUST_PROXY: '2',
    JOBS_ENABLED: 'false',
  });
  assert.equal(config.logLevel, 'debug');
  assert.equal(config.trustProxy, 2);
  assert.equal(config.jobsEnabled, false);

  assert.throws(
    () => readConfig({ ...baseEnv, LOG_LEVEL: 'verbose' }),
    (error: unknown) => error instanceof ConfigurationError,
  );
  assert.throws(
    () => readConfig({ ...baseEnv, JOBS_ENABLED: 'yes' }),
    (error: unknown) => error instanceof ConfigurationError,
  );
});

test('日志级别过滤低优先级事件', () => {
  const lines: string[] = [];
  const logger = createLogger({
    level: 'warn',
    sink: (_level, line) => lines.push(line),
    now: () => new Date('2026-11-11T00:00:00.000Z'),
  });
  logger.debug('debug.event');
  logger.info('info.event');
  logger.warn('warn.event', { requestId: 'r1' });
  logger.error('error.event', { requestId: 'r2' });
  assert.equal(lines.length, 2);
  assert.match(lines[0] ?? '', /"event":"warn\.event"/);
  assert.match(lines[1] ?? '', /"event":"error\.event"/);
});

test('请求上下文写入请求 ID 和安全响应头', () => {
  const headers: Record<string, string> = {};
  const response = {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
  };
  let observed = '';
  requestContext(
    {} as never,
    response as never,
    (() => {
      observed = currentRequestId() ?? '';
    }) as never,
  );
  const security = securityHeaders({ production: true });
  security({ secure: true } as never, response as never, (() => undefined) as never);
  assert.match(observed, /^[0-9a-f-]{36}$/);
  assert.equal(headers['X-Request-Id'], observed);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.ok(headers['Content-Security-Policy']);
  assert.ok(headers['Strict-Transport-Security']);
});

test('系统设置校验范围并拒绝非法值', () => {
  const valid = {
    reservation: {
      advanceDays: 7,
      dailyLimit: 2,
      createPerMinute: 10,
      cancelPerMinute: 10,
    },
    feedback: { createPerMinute: 3, createPerHour: 10 },
    violation: { threshold: 3, restrictionDays: 7 },
  };
  assert.deepEqual(validateOperationalSettings(valid), valid);
  assert.throws(() =>
    validateOperationalSettings({
      ...valid,
      reservation: { ...valid.reservation, advanceDays: 31 },
    }),
  );
});

test('动态限流器读取实时上限并返回 Retry-After', async () => {
  let limit = 2;
  const handler = createDynamicUserRateLimiter({
    limit: async () => limit,
    windowMs: 60_000,
    now: () => 1_000,
  });
  const request = { auth: { user: { id: '7' } } };
  function run(): Promise<unknown> {
    return new Promise((resolve) => {
      handler(
        request as never,
        {} as never,
        ((error?: unknown) => resolve(error ?? null)) as never,
      );
    });
  }
  assert.equal(await run(), null);
  assert.equal(await run(), null);
  const limited = await run();
  assert.equal((limited as { code?: string }).code, 'RATE_LIMITED');
  assert.equal((limited as { headers?: Record<string, string> }).headers?.['Retry-After'], '60');
  limit = 4;
  assert.equal(await run(), null);
});
