import { Op } from 'sequelize';
import { UniqueConstraintError } from 'sequelize';
import { createDatabase } from '../src/config/database.js';
import { loadDatabaseConfig } from '../src/config/env.js';
import { addBusinessDays, formatSeatNumber, toBusinessDate } from '../src/lib/study-room-time.js';
import { createAuthenticationModels } from '../src/models/index.js';
import { createStudyRoomModels } from '../src/models/study-room-models.js';

interface SeedRoom {
  name: string;
  location: string;
  description: string;
  status: 'open' | 'closed';
  rows: number;
  columns: number;
  prefix: string;
  skip: ReadonlySet<string>;
  slots: readonly {
    label: string;
    startTime: string;
    endTime: string;
    status?: 'active' | 'inactive';
  }[];
}

const rooms: readonly SeedRoom[] = [
  {
    name: '图书馆三层自习室',
    location: '图书馆 3F-301',
    description: '安静自习区域，请保持桌面整洁，禁止携带食物入内。',
    status: 'open',
    rows: 8,
    columns: 10,
    prefix: 'A',
    skip: new Set(['1:4', '2:4', '3:4', '4:4', '5:4', '6:4', '7:4', '8:4']),
    slots: [
      { label: '上午一', startTime: '08:00', endTime: '10:00' },
      { label: '上午二', startTime: '10:00', endTime: '12:00' },
      { label: '下午一', startTime: '14:00', endTime: '16:00' },
      { label: '下午二', startTime: '16:00', endTime: '18:00' },
      { label: '晚间', startTime: '19:00', endTime: '21:00' },
    ],
  },
  {
    name: '教学楼 A203 自习室',
    location: '教学楼 A 座 2F-203',
    description: '靠近教学区，适合课间和晚间自习。',
    status: 'open',
    rows: 6,
    columns: 8,
    prefix: 'B',
    skip: new Set(['1:3', '2:3', '3:3', '4:3', '5:3', '6:3']),
    slots: [
      { label: '上午', startTime: '08:00', endTime: '12:00' },
      { label: '下午', startTime: '14:00', endTime: '18:00' },
      { label: '晚间', startTime: '19:00', endTime: '21:00' },
    ],
  },
  {
    name: '东区研讨空间',
    location: '东区学生中心 1F-105',
    description: '小型研讨空间，等待管理员完成最终开放配置。',
    status: 'closed',
    rows: 4,
    columns: 6,
    prefix: 'C',
    skip: new Set(),
    slots: [
      { label: '上午', startTime: '09:00', endTime: '11:00' },
      { label: '下午', startTime: '14:00', endTime: '16:00' },
    ],
  },
];

async function main() {
  const database = createDatabase(loadDatabaseConfig());
  try {
    const authModels = createAuthenticationModels(database.sequelize);
    const models = createStudyRoomModels(database.sequelize, authModels);
    const today = toBusinessDate(new Date());
    const pastDate = addBusinessDays(today, -1);
    let createdRooms = 0;

    await database.sequelize.transaction(async (transaction) => {
      for (const config of rooms) {
        const existing = await models.StudyRoom.findOne({
          where: { name: config.name, location: config.location },
          transaction,
        });
        if (existing) continue;
        const room = await models.StudyRoom.create(
          {
            name: config.name,
            location: config.location,
            description: config.description,
            grid_rows: config.rows,
            grid_columns: config.columns,
            status: config.status,
            bookable_from: pastDate,
          },
          { transaction },
        );
        await models.RoomTimeSlot.bulkCreate(
          config.slots.map((slot) => ({
            room_id: String(room.id),
            label: slot.label,
            start_time: slot.startTime,
            end_time: slot.endTime,
            status: slot.status ?? 'active',
            bookable_from: pastDate,
          })),
          { transaction },
        );

        const seats = [];
        let sequence = 1;
        for (let row = 1; row <= config.rows; row += 1) {
          for (let column = 1; column <= config.columns; column += 1) {
            if (config.skip.has(`${row}:${column}`)) continue;
            seats.push({
              room_id: String(room.id),
              batch_prefix: config.prefix,
              seat_no: formatSeatNumber(config.prefix, sequence),
              row_no: row,
              column_no: column,
              status: 'available' as const,
              bookable_from: pastDate,
              remark: null,
            });
            sequence += 1;
          }
        }
        await models.Seat.bulkCreate(seats, { transaction });
        createdRooms += 1;
      }

      const library = await models.StudyRoom.findOne({
        where: { name: '图书馆三层自习室', location: '图书馆 3F-301' },
        transaction,
      });
      if (library) {
        await models.Seat.update(
          { status: 'maintenance', remark: '椅面维修' },
          {
            where: {
              room_id: library.id,
              seat_no: { [Op.in]: ['A-07', 'A-31'] },
            },
            transaction,
          },
        );
        await models.Seat.update(
          { status: 'disabled', remark: '靠近设备柜，暂停使用' },
          {
            where: { room_id: library.id, seat_no: 'A-14' },
            transaction,
          },
        );
      }
    });

    console.info(
      createdRooms > 0
        ? `自习室演示数据已创建：${createdRooms} 个房间`
        : '自习室演示数据已存在，未重复创建。',
    );
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error('自习室演示数据初始化失败，请检查迁移和数据库连接。');
  if (error instanceof Error) console.error(error.message);
  if (error instanceof UniqueConstraintError) {
    console.error(error.errors.map((item) => item.message).join('; '));
  }
  if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
    console.error('检测到唯一键冲突；种子脚本不会覆盖已有房间。');
  }
  process.exitCode = 1;
});
