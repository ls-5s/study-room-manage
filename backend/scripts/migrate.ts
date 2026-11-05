import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { createDatabase } from '../src/config/database.js';
import { ConfigurationError, loadDatabaseConfig } from '../src/config/env.js';
import { runMigrations } from '../src/migrations/index.js';
import { executeAdministratorQuery } from './admin-mysql.js';
import { PreparationError, readPreparationConfig } from './database-preparation.js';

async function main() {
  const databaseConfig = loadDatabaseConfig();
  const values = parse(await readFile(fileURLToPath(new URL('../.env', import.meta.url)), 'utf8'));
  const preparation = readPreparationConfig(values);
  const database = createDatabase(databaseConfig);
  try {
    const applied = await runMigrations(database.sequelize, async (sql) => {
      executeAdministratorQuery(
        preparation.containerName,
        `USE \`${preparation.database}\`;\n${sql}`,
      );
    });
    console.info(
      applied.length === 0 ? '数据库结构已是最新版本。' : `数据库迁移完成：${applied.join(', ')}`,
    );
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  if (error instanceof ConfigurationError) {
    console.error(`数据库配置无效：${error.message}`);
  } else if (error instanceof PreparationError) {
    console.error(error.message);
  } else {
    console.error('数据库迁移失败，请检查连接和迁移日志。');
  }
  process.exitCode = 1;
});
