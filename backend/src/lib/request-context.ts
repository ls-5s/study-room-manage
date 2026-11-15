import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

interface RequestContext {
  requestId: string;
  startedAt: number;
}

const contextStorage = new AsyncLocalStorage<RequestContext>();

export const requestContext: RequestHandler = (request, response, next) => {
  const requestId = randomUUID();
  const context = { requestId, startedAt: performance.now() };
  request.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);
  contextStorage.run(context, next);
};

export function currentRequestId(): string | null {
  return contextStorage.getStore()?.requestId ?? null;
}

export function currentRequestStartedAt(): number {
  return contextStorage.getStore()?.startedAt ?? performance.now();
}
