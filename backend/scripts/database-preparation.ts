export const PROJECT_DATABASE = 'study_room_manage';
export const APPLICATION_USER = 'study_room_app';
export const APPLICATION_HOST = '%';

const APPLICATION_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] as const;

export class PreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PreparationError';
  }
}

export interface PreparationConfig {
  containerName: string;
  host: string;
  port: number;
  database: typeof PROJECT_DATABASE;
  user: typeof APPLICATION_USER;
  password: string;
}

export interface PreparationDependencies {
  adminQuery: (sql: string) => Promise<string>;
  verifyApplication: (config: PreparationConfig, withDatabase: boolean) => Promise<void>;
  persistGeneratedPassword: (password: string) => Promise<void>;
  generatePassword: () => string;
  log: (message: string) => void;
}

export function readPreparationConfig(
  values: Record<string, string | undefined>,
): PreparationConfig {
  const containerName = values.MYSQL_CONTAINER || 'mysql8';
  const host = values.DB_HOST || '127.0.0.1';
  const port = Number(values.DB_PORT || '3306');

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(containerName)) {
    throw new PreparationError('MYSQL_CONTAINER 格式无效。');
  }
  if (!['127.0.0.1', 'localhost', '::1'].includes(host)) {
    throw new PreparationError('数据库准备工具仅支持连接本机现有 MySQL 容器。');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new PreparationError('DB_PORT 必须是有效端口。');
  }
  if (values.DB_NAME !== PROJECT_DATABASE || values.DB_USER !== APPLICATION_USER) {
    throw new PreparationError('准备工具仅允许操作 study_room_manage 和 study_room_app。');
  }

  return {
    containerName,
    host,
    port,
    database: PROJECT_DATABASE,
    user: APPLICATION_USER,
    password: values.DB_PASSWORD || '',
  };
}

// The administrator connection sets NO_BACKSLASH_ESCAPES before executing SQL.
export function quoteSqlString(value: string): string {
  if (value.includes('\0')) {
    throw new PreparationError('配置中不能包含空字符。');
  }
  return `'${value.replaceAll("'", "''")}'`;
}

function quoteIdentifier(value: string): string {
  return `\`${value.replaceAll('`', '``')}\``;
}

export function grantDatabaseName(partialRevokes: boolean): string {
  // With partial_revokes disabled, underscores are wildcards in database grants.
  return partialRevokes ? PROJECT_DATABASE : PROJECT_DATABASE.replaceAll('_', '\\_');
}

export function assertApplicationGrants(
  output: string,
  partialRevokes: boolean,
  requireAllPrivileges: boolean,
): void {
  const account = `${quoteIdentifier(APPLICATION_USER)}@${quoteIdentifier(APPLICATION_HOST)}`;
  const usage = `GRANT USAGE ON *.* TO ${account}`;
  const scope = `${quoteIdentifier(grantDatabaseName(partialRevokes))}.* TO ${account}`;
  const found = new Set<string>();
  const lines = output.split(/\r?\n/).filter(Boolean);

  if (lines.length === 0) {
    throw new PreparationError('无法核验应用账号权限。');
  }
  for (const line of lines) {
    if (line === usage) continue;
    if (!line.startsWith('GRANT ') || !line.endsWith(` ON ${scope}`)) {
      throw new PreparationError(
        '应用账号包含目标库读写以外的权限；请管理员检查，工具不会自动撤销。',
      );
    }
    const privileges = line.slice('GRANT '.length, -` ON ${scope}`.length).split(', ');
    for (const privilege of privileges) {
      if (!(APPLICATION_PRIVILEGES as readonly string[]).includes(privilege)) {
        throw new PreparationError(
          '应用账号包含目标库读写以外的权限；请管理员检查，工具不会自动撤销。',
        );
      }
      found.add(privilege);
    }
  }
  if (requireAllPrivileges && APPLICATION_PRIVILEGES.some((privilege) => !found.has(privilege))) {
    throw new PreparationError('应用账号的项目库读写权限不完整。');
  }
}

export function insertGeneratedPassword(contents: string, password: string): string {
  if (!/^[a-f0-9]{64}$/.test(password)) {
    throw new PreparationError('生成的应用密码格式无效。');
  }
  const line = `DB_PASSWORD=${password}`;
  const pattern = /^(?:export[ \t]+)?DB_PASSWORD[ \t]*=.*$/gm;
  if (pattern.test(contents)) return contents.replace(pattern, line);
  const separator = contents.includes('\r\n') ? '\r\n' : '\n';
  return `${contents}${contents.endsWith('\n') || !contents ? '' : separator}${line}${separator}`;
}

export async function prepareDatabase(
  config: PreparationConfig,
  dependencies: PreparationDependencies,
): Promise<void> {
  const { adminQuery, verifyApplication, persistGeneratedPassword, generatePassword, log } =
    dependencies;
  // Both statements are read-only. Do not write an environment file before admin access is proven.
  const partialRevokesValue = (await adminQuery('SELECT @@GLOBAL.partial_revokes;')).trim();
  if (!['0', '1'].includes(partialRevokesValue)) {
    throw new PreparationError('无法识别 MySQL 数据库权限配置。');
  }
  const partialRevokes = partialRevokesValue === '1';
  const hosts = (
    await adminQuery(
      `SELECT Host FROM mysql.user WHERE User = ${quoteSqlString(APPLICATION_USER)};`,
    )
  )
    .split(/\r?\n/)
    .filter(Boolean);
  if (hosts.some((host) => host !== APPLICATION_HOST)) {
    throw new PreparationError('存在其他主机范围的同名应用账号；请管理员核验后再执行。');
  }
  const userExists = hosts.includes(APPLICATION_HOST);
  const showGrants = `SHOW GRANTS FOR ${quoteSqlString(APPLICATION_USER)}@${quoteSqlString(APPLICATION_HOST)};`;
  let password = config.password;

  if (userExists) {
    if (!password) {
      throw new PreparationError(
        '应用账号已存在，但本地 DB_PASSWORD 缺失；请恢复原密码，工具不会重置账号。',
      );
    }
    await verifyApplication(config, false);
    assertApplicationGrants(await adminQuery(showGrants), partialRevokes, false);
    log('应用账号已存在，认证及现有权限检查通过。');
  } else if (!password) {
    password = generatePassword();
    await persistGeneratedPassword(password);
    log('应用密码已生成并保存到后端本地环境文件。');
  }

  const resolvedConfig: PreparationConfig = { ...config, password };
  await adminQuery(
    `CREATE DATABASE IF NOT EXISTS ${quoteIdentifier(PROJECT_DATABASE)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );
  if (!userExists) {
    await adminQuery(
      `CREATE USER IF NOT EXISTS ${quoteSqlString(APPLICATION_USER)}@${quoteSqlString(APPLICATION_HOST)} IDENTIFIED BY ${quoteSqlString(password)};`,
    );
    log('项目应用账号已创建。');
  }
  await adminQuery(
    `GRANT ${APPLICATION_PRIVILEGES.join(', ')} ON ${quoteIdentifier(grantDatabaseName(partialRevokes))}.* TO ${quoteSqlString(APPLICATION_USER)}@${quoteSqlString(APPLICATION_HOST)};`,
  );
  assertApplicationGrants(await adminQuery(showGrants), partialRevokes, true);
  await verifyApplication(resolvedConfig, true);
  log('项目数据库准备完成，应用账号连接与限定权限验证通过。');
}
