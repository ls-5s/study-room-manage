import { randomUUID } from 'node:crypto';
import { HttpError } from '../middleware/errors.js';
import { createCheckInPayload, type CheckInPayload } from '../lib/check-in-token.js';
import type { ReservationModels } from '../models/reservation-models.js';

export interface CheckInCodeView {
  roomId: string;
  issuedAt: string;
  payload: CheckInPayload;
}

/**
 * Room check-in codes are long-lived: they never expire and every issue() simply produces a
 * fresh QR image (a new nonce) so the screen looks live. Previously shown codes keep working,
 * which is the trade-off of a permanent code — the only gate left is the per-reservation
 * check-in window.
 *
 * `study_rooms.check_in_nonce` stores the nonce of the code that was shown last; it is written
 * for traceability (`check_ins.nonce` records which code a student used) and is not compared
 * during verification.
 */
export class CheckInCodeService {
  constructor(
    private readonly models: ReservationModels,
    private readonly secret: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  private async loadRoom(rawRoomId: string) {
    const roomId = rawRoomId.trim();
    if (!/^\d{1,20}$/.test(roomId)) {
      throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
        fields: { roomId: '自习室编号格式不正确' },
      });
    }
    const room = await this.models.StudyRoom.findByPk(roomId);
    if (!room) throw new HttpError(404, 'NOT_FOUND', '自习室不存在');
    return room;
  }

  async issue(rawRoomId: string): Promise<CheckInCodeView> {
    const room = await this.loadRoom(rawRoomId);
    const nonce = randomUUID();
    room.check_in_nonce = nonce;
    await room.save();
    const payload = createCheckInPayload(this.secret, String(room.id), nonce, this.now());
    return { roomId: String(room.id), issuedAt: payload.issuedAt, payload };
  }
}
