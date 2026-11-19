import { randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import { hashPassword } from '../src/lib/password.js';
import { buildSlotWindow } from '../src/lib/reservation-time.js';
import { toBusinessDate } from '../src/lib/study-room-time.js';
import type { ReservationModels } from '../src/models/reservation-models.js';
import type { ReservationStatus } from '../src/models/reservation.model.js';
import { initViolationModel } from '../src/models/violation.model.js';

// 今日演示使用业务源记录，避免实时刷新把写在统计表中的示例数值清零。
export async function seedTodayStatistics(models: ReservationModels, now: Date): Promise<number> {
  const sequelize = models.Reservation.sequelize!;
  const Violation = initViolationModel(sequelize);
  const today = toBusinessDate(now);
  const rooms = await models.StudyRoom.findAll({
    where: { status: 'open', bookable_from: { [Op.lte]: today } },
    order: [['id', 'ASC']],
  });
  const passwordHash = await hashPassword(randomBytes(20).toString('hex'), 12);
  let created = 0;
  let studentIndex = 0;

  for (const room of rooms) {
    const slot = await models.RoomTimeSlot.findOne({
      where: { room_id: room.id, status: 'active', bookable_from: { [Op.lte]: today } },
      order: [['start_time', 'ASC']],
    });
    if (!slot) continue;
    const seats = await models.Seat.findAll({
      where: { room_id: room.id, status: 'available', bookable_from: { [Op.lte]: today } },
      order: [['id', 'ASC']],
      limit: 8,
    });
    const window = buildSlotWindow(today, slot.start_time, slot.end_time);
    const createdAt = new Date(
      Math.min(now.getTime(), window.checkInOpenAt.getTime() - 60 * 60_000),
    );

    for (const [index, seat] of seats.entries()) {
      studentIndex += 1;
      const key = `stats_demo_${today}_${room.id}_${slot.id}_${seat.id}`;
      if (await models.Reservation.findOne({ where: { idempotency_key: key } })) continue;
      // 不占用已有预约的座位，也不为已被使用过的时段补造另一条记录。
      const occupied = await models.Reservation.count({
        where: {
          seat_id: seat.id,
          reserve_date: today,
          status: { [Op.ne]: 'cancelled' },
          start_at: { [Op.lt]: window.endAt },
          end_at: { [Op.gt]: window.startAt },
        },
      });
      if (occupied) continue;

      const missed = index % 5 === 4 && now > window.checkInDeadline;
      const signedIn = !missed && now >= window.startAt;
      const status: ReservationStatus = missed
        ? 'no_show'
        : signedIn
          ? now >= window.endAt
            ? 'completed'
            : 'checked_in'
          : 'pending';
      const changedAt = missed
        ? window.checkInDeadline
        : status === 'completed'
          ? window.endAt
          : signedIn
            ? window.startAt
            : createdAt;

      await sequelize.transaction(async (transaction) => {
        // 每位演示学生当天只生成一场预约，账号禁用且使用随机密码。
        const username = `stats_demo_${String(studentIndex).padStart(3, '0')}`;
        const [user] = await models.User.findOrCreate({
          where: { username },
          transaction,
          defaults: {
            username,
            student_no: `STATSDEMO${studentIndex}`,
            display_name: `统计演示同学${studentIndex}`,
            password_hash: passwordHash,
            role: 'student',
            status: 'disabled',
            email: null,
            phone: null,
            avatar_url: null,
            restriction_started_at: null,
            restriction_until: null,
            last_login_at: null,
          },
        });
        if (user.student_no !== `STATSDEMO${studentIndex}` || user.status !== 'disabled') {
          throw new Error(`统计演示账号 ${username} 与已有账号冲突。`);
        }
        const reservation = await models.Reservation.create(
          {
            user_id: String(user.id),
            room_id: String(room.id),
            slot_id: String(slot.id),
            seat_id: String(seat.id),
            room_name_snapshot: room.name,
            room_location_snapshot: room.location,
            seat_no_snapshot: seat.seat_no,
            reserve_date: today,
            start_at: window.startAt,
            end_at: window.endAt,
            check_in_open_at: window.checkInOpenAt,
            check_in_deadline: window.checkInDeadline,
            status,
            idempotency_key: key,
            cancel_reason: null,
            cancelled_by: null,
            cancelled_at: null,
            created_at: createdAt,
            updated_at: changedAt,
          },
          { transaction },
        );
        const reservationId = String(reservation.id);
        await models.ReservationStatusLog.create(
          {
            reservation_id: reservationId,
            from_status: null,
            to_status: 'pending',
            actor_type: 'system',
            actor_id: null,
            reason: '统计演示：创建预约',
            occurred_at: createdAt,
          },
          { transaction },
        );
        if (signedIn) {
          await models.CheckIn.create(
            {
              reservation_id: reservationId,
              business_date: today,
              checked_in_at: window.startAt,
              method: 'qr',
              nonce: null,
              operator_id: null,
              remark: '统计演示签到记录',
              created_at: window.startAt,
            },
            { transaction },
          );
          await models.ReservationStatusLog.create(
            {
              reservation_id: reservationId,
              from_status: 'pending',
              to_status: 'checked_in',
              actor_type: 'system',
              actor_id: null,
              reason: '统计演示：签到',
              occurred_at: window.startAt,
            },
            { transaction },
          );
        }
        if (status === 'completed' || missed) {
          await models.ReservationStatusLog.create(
            {
              reservation_id: reservationId,
              from_status: missed ? 'pending' : 'checked_in',
              to_status: status,
              actor_type: 'system',
              actor_id: null,
              reason: '统计演示：时段结算',
              occurred_at: changedAt,
            },
            { transaction },
          );
        }
        if (missed) {
          await Violation.create(
            {
              user_id: String(user.id),
              reservation_id: reservationId,
              type: 'no_show',
              status: 'active',
              reason: '统计演示：未在签到窗口内签到',
              occurred_at: changedAt,
              resolved_by: null,
              resolved_at: null,
              resolution_reason: null,
              created_at: changedAt,
              updated_at: changedAt,
            },
            { transaction },
          );
          await user.increment('violation_count', { transaction });
        }
        created += 1;
      });
    }
  }
  return created;
}
