import type { Migration } from './types.js';

export const sessionCreatedAtPrecisionMigration: Migration = {
  id: '013',
  name: 'session-created-at-precision',
  async up(execute) {
    await execute('ALTER TABLE user_sessions MODIFY created_at DATETIME(3) NOT NULL');
  },
  async down(execute) {
    await execute('ALTER TABLE user_sessions MODIFY created_at DATETIME NOT NULL');
  },
};
