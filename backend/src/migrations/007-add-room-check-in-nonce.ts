import type { Migration } from './types.js';

const addRoomCheckInNonce = `
  ALTER TABLE study_rooms
    ADD COLUMN check_in_nonce CHAR(36) NULL
      COMMENT '当前签到码随机标识；轮换后旧码立即失效'
`;

export const addRoomCheckInNonceMigration: Migration = {
  id: '007',
  name: 'add-room-check-in-nonce',
  async up(execute) {
    await execute(addRoomCheckInNonce);
  },
  async down(execute) {
    await execute('ALTER TABLE study_rooms DROP COLUMN check_in_nonce;');
  },
};
