import { validationResult } from 'express-validator';
import type { RequestHandler } from 'express';
import { HttpError } from '../middleware/errors.js';

export const validateRequest: RequestHandler = (request, _response, next) => {
  const result = validationResult(request);
  if (result.isEmpty()) {
    next();
    return;
  }

  const fields: Record<string, string> = {};
  for (const error of result.array()) {
    if (error.type === 'field' && !fields[error.path]) fields[error.path] = error.msg;
  }
  next(new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', { fields }));
};
