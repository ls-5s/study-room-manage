import type { Migration } from './types.js';

const createDailyStatisticsRuns = `
  CREATE TABLE IF NOT EXISTS daily_statistics_runs (
    stat_date DATE NOT NULL PRIMARY KEY,
    capacity_snapshotted_at DATETIME NOT NULL,
    finalized_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

const createDailySlotMetrics = `
  CREATE TABLE IF NOT EXISTS daily_slot_metrics (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    stat_date DATE NOT NULL,
    room_id BIGINT UNSIGNED NOT NULL,
    room_name_snapshot VARCHAR(64) NOT NULL,
    slot_id BIGINT UNSIGNED NOT NULL,
    slot_label VARCHAR(32) NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    bookable_seat_count INT UNSIGNED NOT NULL,
    available_seat_minutes BIGINT UNSIGNED NOT NULL,
    reservation_count INT UNSIGNED NOT NULL DEFAULT 0,
    checked_in_count INT UNSIGNED NOT NULL DEFAULT 0,
    no_show_count INT UNSIGNED NOT NULL DEFAULT 0,
    outage_cancelled_count INT UNSIGNED NOT NULL DEFAULT 0,
    used_seat_minutes BIGINT UNSIGNED NOT NULL DEFAULT 0,
    finalized_at DATETIME NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_daily_slot_metrics_slot (stat_date, room_id, slot_id),
    KEY idx_daily_slot_metrics_room_date (room_id, stat_date),
    KEY idx_daily_slot_metrics_slot_date (slot_id, stat_date),
    CONSTRAINT fk_daily_slot_metrics_room
      FOREIGN KEY (room_id) REFERENCES study_rooms (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_daily_slot_metrics_slot
      FOREIGN KEY (slot_id) REFERENCES room_time_slots (id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

export const createStatisticsTablesMigration: Migration = {
  id: '011',
  name: 'create-statistics-tables',
  async up(execute) {
    await execute(createDailyStatisticsRuns);
    await execute(createDailySlotMetrics);
  },
  async down(execute) {
    await execute('DROP TABLE IF EXISTS daily_slot_metrics;');
    await execute('DROP TABLE IF EXISTS daily_statistics_runs;');
  },
};
