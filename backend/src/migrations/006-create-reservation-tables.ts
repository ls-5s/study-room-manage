import type { Migration } from './types.js';

const createReservations = `
  CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    room_id BIGINT UNSIGNED NOT NULL,
    seat_id BIGINT UNSIGNED NOT NULL,
    slot_id BIGINT UNSIGNED NOT NULL,
    room_name_snapshot VARCHAR(64) NOT NULL,
    room_location_snapshot VARCHAR(128) NOT NULL,
    seat_no_snapshot VARCHAR(32) NOT NULL,
    reserve_date DATE NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    check_in_open_at DATETIME NOT NULL,
    check_in_deadline DATETIME NOT NULL,
    status ENUM('pending', 'checked_in', 'completed', 'cancelled', 'no_show')
      NOT NULL DEFAULT 'pending',
    idempotency_key VARCHAR(64) NULL,
    cancel_reason VARCHAR(255) NULL,
    cancelled_by BIGINT UNSIGNED NULL,
    cancelled_at DATETIME NULL,
    active_slot_key VARCHAR(96) AS (
      CASE
        WHEN status IN ('pending', 'checked_in')
          THEN CONCAT(seat_id, ':', DATE_FORMAT(reserve_date, '%Y-%m-%d'), ':', slot_id)
        ELSE NULL
      END
    ) STORED,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_reservations_active_slot (active_slot_key),
    UNIQUE KEY uk_reservations_user_idempotency (user_id, idempotency_key),
    KEY idx_reservations_user_date_status (user_id, reserve_date, status),
    KEY idx_reservations_room_date_slot_status (room_id, reserve_date, slot_id, status),
    KEY idx_reservations_seat_date_status (seat_id, reserve_date, status),
    KEY idx_reservations_status_deadline (status, check_in_deadline),
    KEY idx_reservations_status_end (status, end_at),
    CONSTRAINT fk_reservations_user
      FOREIGN KEY (user_id) REFERENCES users (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_reservations_room
      FOREIGN KEY (room_id) REFERENCES study_rooms (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_reservations_slot
      FOREIGN KEY (slot_id) REFERENCES room_time_slots (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_reservations_seat
      FOREIGN KEY (seat_id) REFERENCES seats (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT reservations_window_order_check CHECK (start_at < end_at),
    CONSTRAINT reservations_check_in_order_check CHECK (
      check_in_open_at < check_in_deadline AND check_in_deadline <= end_at
    )
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const createCheckIns = `
  CREATE TABLE IF NOT EXISTS check_ins (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT UNSIGNED NOT NULL,
    checked_in_at DATETIME NOT NULL,
    business_date DATE NOT NULL,
    method ENUM('qr', 'manual') NOT NULL,
    nonce CHAR(36) NULL,
    operator_id BIGINT UNSIGNED NULL,
    remark VARCHAR(255) NULL,
    created_at DATETIME NOT NULL,
    UNIQUE KEY uk_check_ins_reservation (reservation_id),
    KEY idx_check_ins_business_date (business_date),
    CONSTRAINT fk_check_ins_reservation
      FOREIGN KEY (reservation_id) REFERENCES reservations (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const createReservationStatusLogs = `
  CREATE TABLE IF NOT EXISTS reservation_status_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT UNSIGNED NOT NULL,
    from_status ENUM('pending', 'checked_in', 'completed', 'cancelled', 'no_show') NULL,
    to_status ENUM('pending', 'checked_in', 'completed', 'cancelled', 'no_show') NOT NULL,
    actor_type ENUM('user', 'admin', 'system') NOT NULL,
    actor_id BIGINT UNSIGNED NULL,
    reason VARCHAR(255) NULL,
    occurred_at DATETIME NOT NULL,
    UNIQUE KEY uk_status_logs_reservation_to (reservation_id, to_status),
    KEY idx_status_logs_reservation_time (reservation_id, occurred_at),
    KEY idx_status_logs_to_time (to_status, occurred_at),
    CONSTRAINT fk_status_logs_reservation
      FOREIGN KEY (reservation_id) REFERENCES reservations (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const createReservationTablesMigration: Migration = {
  id: '006',
  name: 'create-reservation-tables',
  async up(execute) {
    await execute(createReservations);
    await execute(createCheckIns);
    await execute(createReservationStatusLogs);
  },
  async down(execute) {
    await execute('DROP TABLE IF EXISTS reservation_status_logs;');
    await execute('DROP TABLE IF EXISTS check_ins;');
    await execute('DROP TABLE IF EXISTS reservations;');
  },
};
