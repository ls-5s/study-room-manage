import {
  APPLICATION_HOST,
  APPLICATION_USER,
  PreparationError,
  type PreparationConfig,
} from './database-preparation.js';

export interface ApplicationConnectionOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database?: string;
  connectTimeout: number;
  multipleStatements: false;
}

export interface ApplicationQueryOptions {
  sql: string;
  timeout: number;
}

export interface ApplicationConnection {
  query: (options: ApplicationQueryOptions) => Promise<readonly [unknown, unknown]>;
  end: () => Promise<void>;
  destroy: () => void;
}

export type ApplicationConnectionFactory = (
  options: ApplicationConnectionOptions,
) => Promise<ApplicationConnection>;

export const APPLICATION_CLOSE_TIMEOUT_MS = 1_000;

function destroyConnection(connection: ApplicationConnection): void {
  try {
    connection.destroy();
  } catch {
    // A cleanup failure must never expose a driver error or keep the process waiting.
  }
}

async function closeVerifiedConnection(connection: ApplicationConnection): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(() => connection.end()),
      new Promise<void>((resolve) => {
        timer = setTimeout(() => {
          destroyConnection(connection);
          resolve();
        }, APPLICATION_CLOSE_TIMEOUT_MS);
      }),
    ]);
  } catch {
    destroyConnection(connection);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function verifyApplication(
  config: PreparationConfig,
  withDatabase: boolean,
  createConnection: ApplicationConnectionFactory,
): Promise<void> {
  let connection: ApplicationConnection | undefined;
  try {
    connection = await createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      ...(withDatabase ? { database: config.database } : {}),
      connectTimeout: 5_000,
      multipleStatements: false,
    });
    const [rows] = await connection.query({
      sql: 'SELECT CURRENT_USER() AS account, DATABASE() AS database_name',
      timeout: 5_000,
    });
    const row: unknown = Array.isArray(rows) ? rows[0] : undefined;
    if (
      !row ||
      typeof row !== 'object' ||
      !('account' in row) ||
      row.account !== `${APPLICATION_USER}@${APPLICATION_HOST}`
    ) {
      throw new Error('Unexpected application account.');
    }
    if (withDatabase && (!('database_name' in row) || row.database_name !== config.database)) {
      throw new Error('Unexpected application database.');
    }
  } catch {
    // A query timeout does not cancel mysql2's active protocol command. Queuing
    // QUIT with end() here could wait forever, so failed connections are destroyed.
    if (connection) destroyConnection(connection);
    throw new PreparationError(
      withDatabase
        ? '应用账号无法连接项目数据库；请检查本地配置与项目库权限。'
        : '已有应用账号认证失败；请恢复正确的 DB_PASSWORD，工具不会修改密码。',
    );
  }

  await closeVerifiedConnection(connection);
}
