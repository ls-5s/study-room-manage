import type { Migration } from './types.js';

export const fixSeatBatchIndexMigration: Migration = {
  id: '005',
  name: 'fix-seat-batch-index',
  async up(execute) {
    await execute('ALTER TABLE seats DROP INDEX seats_room_prefix_unique;');
  },
  async down() {
    // Reintroducing this index would reject every additional seat in the same generated batch.
  },
};
