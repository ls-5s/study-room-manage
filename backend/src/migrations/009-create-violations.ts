import type { Migration } from './types.js';

const createViolations = `
  CREATE TABLE IF NOT EXISTS violations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    reservation_id BIGINT UNSIGNED NOT NULL,
    type ENUM('no_show') NOT NULL DEFAULT 'no_show',
    status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
    reason VARCHAR(255) NOT NULL,
    occurred_at DATETIME NOT NULL,
    resolved_by BIGINT UNSIGNED NULL,
    resolved_at DATETIME NULL,
    resolution_reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_violations_reservation (reservation_id),
    KEY idx_violations_user_status (user_id, status),
    KEY idx_violations_status_occurred (status, occurred_at),
    KEY idx_violations_occurred (occurred_at),
    CONSTRAINT fk_violations_user
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_violations_reservation
      FOREIGN KEY (reservation_id) REFERENCES reservations (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const createViolationsMigration: Migration = {
  id: '009',
  name: 'create-violations',
  async up(execute) {
    await execute(createViolations);
  },
  async down(execute) {
    await execute('DROP TABLE IF EXISTS violations;');
  },
};
