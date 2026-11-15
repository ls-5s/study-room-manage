import { execFileSync } from 'node:child_process';
import { PreparationError } from './database-preparation.js';

const administratorCommand = `set -eu
if [ -n "\${MYSQL_ROOT_PASSWORD_FILE:-}" ]; then
  MYSQL_PWD="$(cat "$MYSQL_ROOT_PASSWORD_FILE")"
elif [ -n "\${MYSQL_ROOT_PASSWORD:-}" ]; then
  MYSQL_PWD="$MYSQL_ROOT_PASSWORD"
else
  exit 78
fi
export MYSQL_PWD
exec mysql --protocol=socket --user=root --batch --skip-column-names --raw --binary-mode=1 --default-character-set=utf8mb4 --connect-timeout=5`;

export function executeAdministratorQuery(containerName: string, sql: string): string {
  try {
    return execFileSync('docker', ['exec', '-i', containerName, 'sh', '-c', administratorCommand], {
      input: `SET SESSION sql_mode = 'NO_BACKSLASH_ESCAPES';\n${sql}\n`,
      encoding: 'utf8',
      timeout: 15_000,
      maxBuffer: 4 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    }).trim();
  } catch (error) {
    const stderr =
      typeof error === 'object' && error !== null && 'stderr' in error ? String(error.stderr) : '';
    const errorCode = /ERROR \d+(?: \([^)]+\))?/.exec(stderr)?.[0];
    throw new PreparationError(
      `MySQL 管理操作失败${errorCode ? `（${errorCode}）` : ''}，请检查 Docker、目标容器及管理员配置。`,
    );
  }
}
