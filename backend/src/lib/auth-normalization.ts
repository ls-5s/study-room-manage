import { HttpError } from '../middleware/errors.js';

const usernamePattern = /^[a-z0-9_]{4,32}$/;
const studentNoPattern = /^[A-Z0-9-]{4,32}$/;

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeStudentNo(value: string): string {
  return value.trim().replace(/[a-z]/g, (letter) => letter.toUpperCase());
}

export function normalizeEmail(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase() ?? '';
  return normalized.length > 0 ? normalized : null;
}

export function assertValidEmail(value: string | null): void {
  if (!value) return;
  if (value.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { email: '请输入有效的邮箱地址' },
    });
  }
}

export function normalizeDisplayName(value: string): string {
  return value.trim();
}

export function assertValidDisplayName(value: string): void {
  if (value.length < 2 || value.length > 64) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { displayName: '显示名称需为 2-64 个字符' },
    });
  }
}

export function normalizePhone(value: string | null | undefined): string | null {
  const input = value?.trim() ?? '';
  if (input.length === 0) return null;

  const compact = input.replace(/[\s-]/g, '');
  if (/^1\d{10}$/.test(compact)) return `+86${compact}`;
  if (/^\+86\d{11}$/.test(compact)) return compact;
  if (/^\+\d{8,15}$/.test(compact)) return compact;
  throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
    fields: { phone: '请输入有效的手机号' },
  });
}

export function normalizeAvatarUrl(value: string | null | undefined): string | null {
  const input = value?.trim() ?? '';
  if (input.length === 0) return null;
  if (input.length > 512) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { avatarUrl: '头像地址不能超过 512 个字符' },
    });
  }

  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Invalid avatar URL');
    }
    return url.toString();
  } catch {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { avatarUrl: '头像地址必须是有效的 HTTP 或 HTTPS 地址' },
    });
  }
}

export function assertValidUsername(value: string): void {
  if (!usernamePattern.test(value)) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { username: '用户名需为 4-32 位字母、数字或下划线' },
    });
  }
}

export function assertValidStudentNo(value: string): void {
  if (!studentNoPattern.test(value)) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { studentNo: '学号需为 4-32 位字母、数字或连字符' },
    });
  }
}
