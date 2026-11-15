import type { Migration } from './types.js';

const createStudyRooms = `
  CREATE TABLE IF NOT EXISTS study_rooms (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    location VARCHAR(128) NOT NULL,
    description VARCHAR(500) NULL,
    grid_rows SMALLINT UNSIGNED NOT NULL,
    grid_columns SMALLINT UNSIGNED NOT NULL,
    status ENUM('open', 'closed', 'disabled') NOT NULL DEFAULT 'closed',
    bookable_from DATE NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY study_rooms_location_name_unique (location, name),
    KEY study_rooms_status_bookable (status, bookable_from),
    KEY study_rooms_name (name),
    CONSTRAINT study_rooms_grid_rows_check CHECK (grid_rows BETWEEN 1 AND 50),
    CONSTRAINT study_rooms_grid_columns_check CHECK (grid_columns BETWEEN 1 AND 50)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const createRoomTimeSlots = `
  CREATE TABLE IF NOT EXISTS room_time_slots (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    label VARCHAR(32) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    bookable_from DATE NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY room_time_slots_room_label_unique (room_id, label),
    KEY room_time_slots_room_status_bookable (room_id, status, bookable_from),
    KEY room_time_slots_start_end (start_time, end_time),
    CONSTRAINT room_time_slots_room_fk
      FOREIGN KEY (room_id) REFERENCES study_rooms (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT room_time_slots_time_order_check CHECK (start_time < end_time)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const createSeats = `
  CREATE TABLE IF NOT EXISTS seats (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT UNSIGNED NOT NULL,
    batch_prefix VARCHAR(8) NOT NULL,
    seat_no VARCHAR(32) NOT NULL,
    row_no SMALLINT UNSIGNED NOT NULL,
    column_no SMALLINT UNSIGNED NOT NULL,
    status ENUM('available', 'maintenance', 'disabled') NOT NULL DEFAULT 'available',
    bookable_from DATE NOT NULL,
    remark VARCHAR(255) NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY seats_room_prefix_unique (room_id, batch_prefix),
    UNIQUE KEY seats_room_seat_no_unique (room_id, seat_no),
    UNIQUE KEY seats_room_position_unique (room_id, row_no, column_no),
    KEY seats_room_status_bookable (room_id, status, bookable_from),
    CONSTRAINT seats_room_fk
      FOREIGN KEY (room_id) REFERENCES study_rooms (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT seats_row_check CHECK (row_no BETWEEN 1 AND 50),
    CONSTRAINT seats_column_check CHECK (column_no BETWEEN 1 AND 50)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const createStudyRoomTablesMigration: Migration = {
  id: '004',
  name: 'create-study-room-tables',
  async up(execute) {
    await execute(createStudyRooms);
    await execute(createRoomTimeSlots);
    await execute(createSeats);
  },
  async down(execute) {
    await execute('DROP TABLE IF EXISTS seats;');
    await execute('DROP TABLE IF EXISTS room_time_slots;');
    await execute('DROP TABLE IF EXISTS study_rooms;');
  },
};
