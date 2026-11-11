import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  connectTimeoutMs: number;
  acquireTimeoutMs: number;
  probeTimeoutMs: number;
}

export interface ServerConfig {
  host: string;
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigins: string[];
  database: DatabaseConfig;
  auth: AuthConfig;
}

export interface AuthConfig {
  jwtSecret: string;
  tokenTtlSeconds: number;
  bcryptCost: number;
  /** HMAC key for check-in codes; independent from the JWT secret. */
  checkInSigningSecret: string;
}

export class ConfigurationError extends Error {
  constructor(key: string) {
    super(`环境变量 ${key} 缺失或格式不正确，请检查后端环境配置。`);
    this.name = 'ConfigurationError';
  }
}

function required(env: NodeJS.ProcessEnv, key: string, trim = true): string {
  const raw = env[key];
  const value = trim ? raw?.trim() : raw;
  if (value === undefined || value.trim().length === 0) throw new ConfigurationError(key);
  return value;
}

function integer(env: NodeJS.ProcessEnv, key: string, fallback: number, maximum = 65_535): number {
  const input = env[key]?.trim();
  if (input === undefined) return fallback;
  if (!/^\d+$/.test(input)) throw new ConfigurationError(key);
  const value = Number(input);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new ConfigurationError(key);
  }
  return value;
}

function hostname(env: NodeJS.ProcessEnv, key: string, fallback?: string): string {
  const value = env[key] === undefined && fallback ? fallback : required(env, key);
  // Hostnames and IP literals vary too much to validate by shape; ports are checked separately.
  if (/\s|\//.test(value)) throw new ConfigurationError(key);
  return value;
}

function origins(env: NodeJS.ProcessEnv): string[] {
  const value = env.CORS_ORIGINS ?? 'http://localhost:43081,http://127.0.0.1:43081';
  const values = value.split(',').map((origin) => origin.trim());
  try {
    for (const origin of values) {
      const parsed = new URL(origin);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
        throw new Error('Invalid origin');
      }
    }
  } catch {
    throw new ConfigurationError('CORS_ORIGINS');
  }
  return [...new Set(values)];
}

function checkInSigningSecret(env: NodeJS.ProcessEnv, jwtSecret: string): string {
  const configured = env.CHECK_IN_SIGNING_SECRET?.trim();
  if (configured) {
    if (Buffer.byteLength(configured, 'utf8') < 32) {
      throw new ConfigurationError('CHECK_IN_SIGNING_SECRET');
    }
    return configured;
  }
  // Deriving keeps first-run local setups working while still separating the material used
  // for check-in codes from the raw JWT secret.
  return createHash('sha256').update(`${jwtSecret}:check-in-token`).digest('hex');
}

function authConfig(env: NodeJS.ProcessEnv): AuthConfig {
  const jwtSecret = required(env, 'JWT_SECRET', false);
  if (Buffer.byteLength(jwtSecret, 'utf8') < 32) {
    throw new ConfigurationError('JWT_SECRET');
  }

  const expiresIn = env.JWT_EXPIRES_IN?.trim() ?? '2h';
  const duration = /^(\d+)(m|h)$/.exec(expiresIn);
  if (!duration) throw new ConfigurationError('JWT_EXPIRES_IN');
  const amount = Number(duration[1]);
  const unit = duration[2];
  const multiplier = unit === 'h' ? 3_600 : 60;
  const tokenTtlSeconds = amount * multiplier;
  if (!Number.isSafeInteger(tokenTtlSeconds) || tokenTtlSeconds < 300 || tokenTtlSeconds > 86_400) {
    throw new ConfigurationError('JWT_EXPIRES_IN');
  }

  return {
    jwtSecret,
    tokenTtlSeconds,
    bcryptCost: integer(env, 'BCRYPT_COST', 12, 14),
    checkInSigningSecret: checkInSigningSecret(env, jwtSecret),
  };
}

export function readDatabaseConfig(env: NodeJS.ProcessEnv): DatabaseConfig {
  return {
    host: hostname(env, 'DB_HOST', '127.0.0.1'),
    port: integer(env, 'DB_PORT', 3306),
    name: required(env, 'DB_NAME'),
    user: required(env, 'DB_USER'),
    password: required(env, 'DB_PASSWORD', false),
    connectTimeoutMs: integer(env, 'DB_CONNECT_TIMEOUT_MS', 5000, 60_000),
    acquireTimeoutMs: integer(env, 'DB_ACQUIRE_TIMEOUT_MS', 5000, 60_000),
    probeTimeoutMs: integer(env, 'DB_PROBE_TIMEOUT_MS', 10_000, 60_000),
  };
}

// Pure parsing keeps tests and app imports independent from environment files.
export function readConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new ConfigurationError('NODE_ENV');
  }

  return {
    host: hostname(env, 'HOST', '127.0.0.1'),
    port: integer(env, 'PORT', 43080),
    nodeEnv: nodeEnv as ServerConfig['nodeEnv'],
    corsOrigins: origins(env),
    database: readDatabaseConfig(env),
    auth: authConfig(env),
  };
}

export function loadRuntimeConfig(): ServerConfig {
  // The same relative path works from src/config and compiled dist/config.
  dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
  return readConfig(process.env);
}

export function loadDatabaseConfig(): DatabaseConfig {
  dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
  return readDatabaseConfig(process.env);
}
