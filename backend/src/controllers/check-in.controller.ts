import type { Request, RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import type { CheckInInput, CheckInService } from '../services/check-in.service.js';
import type { CheckInCodeService } from '../services/check-in-code.service.js';
import type { ReservationActor } from '../services/reservation.service.js';
import { success } from '../types/api.js';

function actorOf(request: Request): ReservationActor {
  if (!request.auth) throw new HttpError(401, 'UNAUTHORIZED', '请先登录');
  return { id: request.auth.user.id, role: request.auth.user.role };
}

export function createCheckInController(
  checkIns: CheckInService,
  codes: CheckInCodeService,
): Record<'checkIn' | 'manualCheckIn' | 'issueCode', RequestHandler> {
  return {
    checkIn: async (request, response) => {
      const result = await checkIns.checkIn(
        actorOf(request),
        String(request.params.id),
        request.body as CheckInInput,
      );
      response.json(success(result, '签到成功'));
    },

    manualCheckIn: async (request, response) => {
      const body = request.body as { reason: string };
      const result = await checkIns.manualCheckIn(
        actorOf(request),
        String(request.params.id),
        body.reason,
      );
      response.json(success(result, '人工核验签到成功'));
    },

    issueCode: async (request, response) => {
      const roomId = request.query.roomId;
      if (typeof roomId !== 'string' || !roomId.trim()) {
        throw new HttpError(422, 'VALIDATION_ERROR', '请选择自习室', {
          fields: { roomId: '请选择自习室' },
        });
      }
      const result = await codes.issue(roomId);
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('Pragma', 'no-cache');
      response.json(success(result, '签到码已生成'));
    },
  };
}
