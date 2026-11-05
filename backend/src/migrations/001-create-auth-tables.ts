import type { Migration } from './types.js';

const createUsers = `
  CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_no VARCHAR(32) NOT NULL,
    username VARCHAR(32) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    email VARCHAR(128) NULL,
    phone VARCHAR(20) NULL,
    avatar_url VARCHAR(512) NULL,
    password_hash VARCHAR(100) NOT NULL,
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
    violation_count INT UNSIGNED NOT NULL DEFAULT 0,
    restriction_started_at DATETIME NULL,
    restriction_until DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY users_student_no_unique (student_no),
    UNIQUE KEY users_username_unique (username),
    UNIQUE KEY users_email_unique (email),
    KEY users_role_status_id (role, status, id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const createSessions = `
  CREATE TABLE IF NOT EXISTS user_sessions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    jti CHAR(36) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    UNIQUE KEY user_sessions_jti_unique (jti),
    KEY user_sessions_user_expiry (user_id, expires_at),
    KEY user_sessions_cleanup (expires_at, revoked_at),
    CONSTRAINT user_sessions_user_fk
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const createAuthTablesMigration: Migration = {
  id: '001',
  name: 'create-auth-tables',
  async up(execute) {
    await execute(createUsers);
    await execute(createSessions);
  },
  async down(execute) {
    await execute('DROP TABLE IF EXISTS user_sessions;');
    await execute('DROP TABLE IF EXISTS users;');
  },
};
