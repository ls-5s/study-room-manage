import type { Transaction } from 'sequelize';
import { currentRequestId } from '../lib/request-context.js';
import { HttpError } from '../middleware/errors.js';
import type { AuditLog } from '../models/audit-log.model.js';
import type { SettingsService } from './settings.service.js';

export const SETTINGS_KEYS = {
  reservationAdvanceDays: 'reservation.advanceDays',
  reservationDailyLimit: 'reservation.dailyLimit',
  reservationCreatePerMinute: 'reservation.createRatePerMinute',
  reservationCancelPerMinute: 'reservation.cancelRatePerMinute',
  feedbackPerMinute: 'feedback.createPerMinute',
  feedbackPerHour: 'feedback.createPerHour',
  violationThreshold: 'violation.threshold',
  violationRestrictionDays: 'violation.restrictionDays',
} as const;

export const OPERATIONAL_SETTINGS_DEFAULTS = {
  reservation: {
    advanceDays: 7,
    dailyLimit: 2,
    createPerMinute: 10,
    cancelPerMinute: 10,
  },
  feedback: {
    createPerMinute: 3,
    createPerHour: 10,
  },
  violation: {
    threshold: 3,
    restrictionDays: 7,
  },
} as const;

export interface OperationalSettingsView {
  reservation: {
    advanceDays: number;
    dailyLimit: number;
    createPerMinute: number;
    cancelPerMinute: number;
  };
  feedback: {
    createPerMinute: number;
    createPerHour: number;
  };
  violation: {
    threshold: number;
    restrictionDays: number;
  };
}

interface OperationalSettingsModels {
  Settings: SettingsService;
  AuditLog: typeof AuditLog;
}

function validateInteger(value: unknown, field: string, minimum: number, maximum: number): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value.trim())
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: {
        [field]: `必须为 ${minimum}-${maximum} 的整数`,
      },
    });
  }
  return parsed;
}

function nestedRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
      fields: { [field]: '配置分组格式不正确' },
    });
  }
  return value as Record<string, unknown>;
}

export function validateOperationalSettings(input: unknown): OperationalSettingsView {
  const root = nestedRecord(input, 'settings');
  const reservation = nestedRecord(root.reservation, 'reservation');
  const feedback = nestedRecord(root.feedback, 'feedback');
  const violation = nestedRecord(root.violation, 'violation');
  return {
    reservation: {
      advanceDays: validateInteger(reservation.advanceDays, 'reservation.advanceDays', 1, 30),
      dailyLimit: validateInteger(reservation.dailyLimit, 'reservation.dailyLimit', 1, 10),
      createPerMinute: validateInteger(
        reservation.createPerMinute,
        'reservation.createPerMinute',
        1,
        100,
      ),
      cancelPerMinute: validateInteger(
        reservation.cancelPerMinute,
        'reservation.cancelPerMinute',
        1,
        100,
      ),
    },
    feedback: {
      createPerMinute: validateInteger(feedback.createPerMinute, 'feedback.createPerMinute', 1, 60),
      createPerHour: validateInteger(feedback.createPerHour, 'feedback.createPerHour', 1, 1000),
    },
    violation: {
      threshold: validateInteger(violation.threshold, 'violation.threshold', 1, 20),
      restrictionDays: validateInteger(
        violation.restrictionDays,
        'violation.restrictionDays',
        1,
        90,
      ),
    },
  };
}

function readInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

export class OperationalSettingsService {
  private cached: OperationalSettingsView | null = null;
  private cacheExpiresAt = 0;

  constructor(
    private readonly models: OperationalSettingsModels,
    private readonly now: () => Date = () => new Date(),
    private readonly cacheMs = 30_000,
  ) {}

  async getAll(force = false): Promise<OperationalSettingsView> {
    if (!force && this.cached && Date.now() < this.cacheExpiresAt) return this.cached;
    const settings = this.models.Settings;
    const values = await Promise.all([
      settings.getJson<unknown>(SETTINGS_KEYS.reservationAdvanceDays, null),
      settings.getJson<unknown>(SETTINGS_KEYS.reservationDailyLimit, null),
      settings.getJson<unknown>(SETTINGS_KEYS.reservationCreatePerMinute, null),
      settings.getJson<unknown>(SETTINGS_KEYS.reservationCancelPerMinute, null),
      settings.getJson<unknown>(SETTINGS_KEYS.feedbackPerMinute, null),
      settings.getJson<unknown>(SETTINGS_KEYS.feedbackPerHour, null),
      settings.getJson<unknown>(SETTINGS_KEYS.violationThreshold, null),
      settings.getJson<unknown>(SETTINGS_KEYS.violationRestrictionDays, null),
    ]);
    const result: OperationalSettingsView = {
      reservation: {
        advanceDays: readInteger(values[0], 7, 1, 30),
        dailyLimit: readInteger(values[1], 2, 1, 10),
        createPerMinute: readInteger(values[2], 10, 1, 100),
        cancelPerMinute: readInteger(values[3], 10, 1, 100),
      },
      feedback: {
        createPerMinute: readInteger(values[4], 3, 1, 60),
        createPerHour: readInteger(values[5], 10, 1, 1000),
      },
      violation: {
        threshold: readInteger(values[6], 3, 1, 20),
        restrictionDays: readInteger(values[7], 7, 1, 90),
      },
    };
    this.cached = result;
    this.cacheExpiresAt = Date.now() + this.cacheMs;
    return result;
  }

  async update(operatorId: string, input: unknown): Promise<OperationalSettingsView> {
    const next = validateOperationalSettings(input);
    const before = await this.getAll(true);
    const entries: ReadonlyArray<readonly [string, number]> = [
      [SETTINGS_KEYS.reservationAdvanceDays, next.reservation.advanceDays],
      [SETTINGS_KEYS.reservationDailyLimit, next.reservation.dailyLimit],
      [SETTINGS_KEYS.reservationCreatePerMinute, next.reservation.createPerMinute],
      [SETTINGS_KEYS.reservationCancelPerMinute, next.reservation.cancelPerMinute],
      [SETTINGS_KEYS.feedbackPerMinute, next.feedback.createPerMinute],
      [SETTINGS_KEYS.feedbackPerHour, next.feedback.createPerHour],
      [SETTINGS_KEYS.violationThreshold, next.violation.threshold],
      [SETTINGS_KEYS.violationRestrictionDays, next.violation.restrictionDays],
    ];
    await this.models.AuditLog.sequelize!.transaction(async (transaction: Transaction) => {
      for (const [key, value] of entries) {
        await this.models.Settings.setJson(key, value, operatorId, transaction);
      }
      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: 'system.settings_updated',
          resource_type: 'system_setting',
          resource_id: '0',
          before_json: before as unknown as Record<string, unknown>,
          after_json: next as unknown as Record<string, unknown>,
          reason: '更新系统运维设置',
          request_id: currentRequestId(),
          created_at: this.now(),
        },
        { transaction },
      );
    });
    this.invalidate();
    return next;
  }

  invalidate(): void {
    this.cached = null;
    this.cacheExpiresAt = 0;
  }
}
