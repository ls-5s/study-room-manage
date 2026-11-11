import type { Migration } from './types.js';

const createSystemSettings = `
  CREATE TABLE IF NOT EXISTS system_settings (
    \`key\` VARCHAR(100) NOT NULL PRIMARY KEY,
    value_json JSON NOT NULL,
    description VARCHAR(255) NULL,
    updated_by BIGINT UNSIGNED NULL,
    updated_at DATETIME NOT NULL,
    CONSTRAINT fk_settings_operator
      FOREIGN KEY (updated_by) REFERENCES users (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const seedThreshold = `
  INSERT IGNORE INTO system_settings (\`key\`, value_json, description, updated_by, updated_at)
  VALUES ('violation.threshold', '3', '累计有效违约达到该次数后限制预约', NULL, NOW())
`;

const seedRestrictionDays = `
  INSERT IGNORE INTO system_settings (\`key\`, value_json, description, updated_by, updated_at)
  VALUES ('violation.restrictionDays', '7', '触发限制后的限制天数', NULL, NOW())
`;

export const createSystemSettingsMigration: Migration = {
  id: '008',
  name: 'create-system-settings',
  async up(execute) {
    await execute(createSystemSettings);
    await execute(seedThreshold);
    await execute(seedRestrictionDays);
  },
  async down(execute) {
    await execute('DROP TABLE IF EXISTS system_settings;');
  },
};
