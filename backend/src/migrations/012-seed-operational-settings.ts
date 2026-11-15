import type { Migration } from './types.js';

const defaults = [
  ['reservation.advanceDays', '7', '允许学生预约的未来天数（含今天）'],
  ['reservation.dailyLimit', '2', '每名学生每日最多有效预约数'],
  ['reservation.createRatePerMinute', '10', '每用户每分钟创建预约上限'],
  ['reservation.cancelRatePerMinute', '10', '每用户每分钟取消预约上限'],
  ['feedback.createPerMinute', '3', '每用户每分钟提交反馈上限'],
  ['feedback.createPerHour', '10', '每用户每小时提交反馈上限'],
] as const;

function seedSql(): string {
  return defaults
    .map(
      ([key, value, description]) => `
        INSERT IGNORE INTO system_settings
          (\`key\`, value_json, description, updated_by, updated_at)
        VALUES
          ('${key}', '${value}', '${description}', NULL, NOW())
      `,
    )
    .join(';\n');
}

export const seedOperationalSettingsMigration: Migration = {
  id: '012',
  name: 'seed-operational-settings',
  async up(execute) {
    await execute(seedSql());
  },
  async down(execute) {
    const keys = defaults.map(([key]) => `'${key}'`).join(', ');
    await execute(`DELETE FROM system_settings WHERE \`key\` IN (${keys});`);
  },
};
