import { QueryTypes, type Sequelize } from 'sequelize';
import { createAuditLogsMigration } from './002-create-audit-logs.js';
import { createAuthTablesMigration } from './001-create-auth-tables.js';
import { addSuperAdminRoleMigration } from './003-add-super-admin-role.js';
import type { Migration } from './types.js';
import type { MigrationSqlExecutor } from './types.js';

export const migrations: readonly Migration[] = [
  createAuthTablesMigration,
  createAuditLogsMigration,
  addSuperAdminRoleMigration,
];

export async function runMigrations(
  sequelize: Sequelize,
  executeAdmin: MigrationSqlExecutor,
): Promise<string[]> {
  await executeAdmin(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id VARCHAR(32) NOT NULL PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      applied_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const applied: string[] = [];
  for (const migration of migrations) {
    const rows = await sequelize.query<{ id: string }>(
      'SELECT id FROM schema_migrations WHERE id = :id LIMIT 1',
      { type: QueryTypes.SELECT, replacements: { id: migration.id } },
    );
    if (rows.length > 0) continue;

    await migration.up(executeAdmin);
    await sequelize.query(
      'INSERT INTO schema_migrations (id, name, applied_at) VALUES (:id, :name, :appliedAt)',
      {
        replacements: {
          id: migration.id,
          name: migration.name,
          appliedAt: new Date(),
        },
      },
    );
    applied.push(`${migration.id}-${migration.name}`);
  }

  return applied;
}
