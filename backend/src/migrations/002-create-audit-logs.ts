import type { Migration } from './types.js';

const createAuditLogs = `
  CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    operator_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id BIGINT UNSIGNED NOT NULL,
    before_json JSON NULL,
    after_json JSON NULL,
    reason VARCHAR(255) NULL,
    request_id VARCHAR(64) NULL,
    created_at DATETIME NOT NULL,
    KEY audit_logs_resource (resource_type, resource_id),
    KEY audit_logs_created_at (created_at),
    CONSTRAINT audit_logs_operator_fk
      FOREIGN KEY (operator_id) REFERENCES users (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const createAuditLogsMigration: Migration = {
  id: '002',
  name: 'create-audit-logs',
  async up(execute) {
    await execute(createAuditLogs);
  },
  async down(execute) {
    await execute('DROP TABLE IF EXISTS audit_logs;');
  },
};
