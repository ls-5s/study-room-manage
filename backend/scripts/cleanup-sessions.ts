import { Op } from 'sequelize';
import { createDatabase } from '../src/config/database.js';
import { ConfigurationError, loadDatabaseConfig } from '../src/config/env.js';
import { createAuthenticationModels } from '../src/models/index.js';

async function main() {
  const database = createDatabase(loadDatabaseConfig());
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);
  try {
    const models = createAuthenticationModels(database.sequelize);
    const deleted = await models.UserSession.destroy({
      where: { expires_at: { [Op.lt]: cutoff } },
    });
    console.info(`会话清理完成：删除 ${deleted} 条过期超过 30 天的记录。`);
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof ConfigurationError
      ? `配置无效：${error.message}`
      : '会话清理失败，请检查数据库连接。',
  );
  process.exitCode = 1;
});
