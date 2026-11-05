import type { Migration } from './types.js';

export const addSuperAdminRoleMigration: Migration = {
  id: '003',
  name: 'add-super-admin-role',
  async up(execute) {
    await execute(`
      ALTER TABLE users
      MODIFY role ENUM('student', 'admin', 'super_admin')
      NOT NULL DEFAULT 'student'
    `);
    await execute(`
      UPDATE users
      SET role = 'super_admin'
      WHERE username = 'admin' AND role = 'admin'
    `);
  },
  async down(execute) {
    await execute("UPDATE users SET role = 'admin' WHERE role = 'super_admin'");
    await execute(`
      ALTER TABLE users
      MODIFY role ENUM('student', 'admin')
      NOT NULL DEFAULT 'student'
    `);
  },
};
