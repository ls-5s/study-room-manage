import type { Migration } from './types.js';

const createFeedbackTickets = `
  CREATE TABLE IF NOT EXISTS feedback_tickets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    room_id BIGINT UNSIGNED NULL,
    seat_id BIGINT UNSIGNED NULL,
    room_name_snapshot VARCHAR(64) NULL,
    seat_no_snapshot VARCHAR(32) NULL,
    type ENUM('occupied_seat', 'equipment', 'environment', 'other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('pending', 'processing', 'resolved', 'rejected')
      NOT NULL DEFAULT 'pending',
    result TEXT NULL,
    handled_by BIGINT UNSIGNED NULL,
    processed_at DATETIME NULL,
    closed_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    KEY idx_feedback_user_created (user_id, created_at),
    KEY idx_feedback_status_created (status, created_at),
    KEY idx_feedback_room_seat_created (room_id, seat_id, created_at),
    KEY idx_feedback_type_created (type, created_at),
    CONSTRAINT fk_feedback_user
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_room
      FOREIGN KEY (room_id) REFERENCES study_rooms (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_seat
      FOREIGN KEY (seat_id) REFERENCES seats (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_handler
      FOREIGN KEY (handled_by) REFERENCES users (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT feedback_ticket_seat_requires_room_check
      CHECK (seat_id IS NULL OR room_id IS NOT NULL)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const createFeedbackTicketsMigration: Migration = {
  id: '010',
  name: 'create-feedback-tickets',
  async up(execute) {
    await execute(createFeedbackTickets);
  },
  async down(execute) {
    // Audit records reference the ticket by type and ID, not by foreign key, and are retained.
    await execute('DROP TABLE IF EXISTS feedback_tickets;');
  },
};
