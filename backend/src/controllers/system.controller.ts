import type { Request, RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';
import type { SystemService } from '../services/system.service.js';
import { success } from '../types/api.js';

function actorId(request: Request): string {
  if (!request.auth) throw new HttpError(401, 'UNAUTHORIZED', '请先登录');
  return request.auth.user.id;
}

export function createSystemController(
  system: SystemService,
): Record<'publicConfig' | 'status' | 'getSettings' | 'updateSettings', RequestHandler> {
  return {
    publicConfig: async (_request, response) => {
      response.json(success(await system.publicConfig(), '查询成功'));
    },
    status: async (_request, response) => {
      response.json(success(await system.status(), '查询成功'));
    },
    getSettings: async (_request, response) => {
      response.json(success(await system.getSettings(), '查询成功'));
    },
    updateSettings: async (request, response) => {
      const settings = await system.updateSettings(actorId(request), request.body);
      response.json(success(settings, '系统设置已更新'));
    },
  };
}
