import { Op, UniqueConstraintError, type Transaction, type WhereOptions } from 'sequelize';
import { HttpError } from '../middleware/errors.js';
import { toBusinessIso, toBusinessText } from '../lib/reservation-time.js';
import type { Reservation } from '../models/reservation.model.js';
import type { User } from '../models/user.model.js';
import type { Violation, ViolationStatus, ViolationType } from '../models/violation.model.js';
import type { ViolationModels } from '../models/violation-models.js';
import type { Logger } from '../lib/logger.js';
import { currentRequestId } from '../lib/request-context.js';
import type { SettingsService } from './settings.service.js';

export const VIOLATION_THRESHOLD_KEY = 'violation.threshold';
export const VIOLATION_RESTRICTION_DAYS_KEY = 'violation.restrictionDays';
export const DEFAULT_THRESHOLD = 3;
export const DEFAULT_RESTRICTION_DAYS = 7;
export const MIN_THRESHOLD = 1;
export const MAX_THRESHOLD = 20;
export const MIN_RESTRICTION_DAYS = 1;
export const MAX_RESTRICTION_DAYS = 90;
export const NO_SHOW_REASON = '预约后未在规定时间签到';

const DAY_MS = 24 * 60 * 60 * 1_000;

export interface ViolationRules {
  threshold: number;
  restrictionDays: number;
}

export interface RestrictionInput {
  activeCount: number;
  threshold: number;
  restrictionDays: number;
  occurredAt: Date;
  startedAt: Date | null;
  until: Date | null;
}

export interface RestrictionResult {
  startedAt: Date | null;
  until: Date | null;
}

/**
 * Pure restriction calculator. A rule change never rewrites an interval that is already in
 * force: an active restriction keeps its original start and only extends its end.
 */
export function computeRestriction(input: RestrictionInput): RestrictionResult {
  const { activeCount, threshold, restrictionDays, occurredAt, startedAt, until } = input;
  if (activeCount < threshold) return { startedAt: null, until: null };

  const candidateUntil = new Date(occurredAt.getTime() + restrictionDays * DAY_MS);
  if (until && until.getTime() > occurredAt.getTime()) {
    return {
      startedAt: startedAt ?? occurredAt,
      until: until.getTime() >= candidateUntil.getTime() ? until : candidateUntil,
    };
  }
  return { startedAt: occurredAt, until: candidateUntil };
}

function fieldError(field: string, message: string): HttpError {
  return new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
    fields: { [field]: message },
  });
}

function asInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

export function validateRulesInput(input: {
  threshold: unknown;
  restrictionDays: unknown;
}): ViolationRules {
  const threshold = asInteger(input.threshold);
  const restrictionDays = asInteger(input.restrictionDays);
  if (threshold === null || threshold < MIN_THRESHOLD || threshold > MAX_THRESHOLD) {
    throw fieldError('threshold', `违约阈值需为 ${MIN_THRESHOLD}-${MAX_THRESHOLD} 的整数`);
  }
  if (
    restrictionDays === null ||
    restrictionDays < MIN_RESTRICTION_DAYS ||
    restrictionDays > MAX_RESTRICTION_DAYS
  ) {
    throw fieldError(
      'restrictionDays',
      `限制天数需为 ${MIN_RESTRICTION_DAYS}-${MAX_RESTRICTION_DAYS} 的整数`,
    );
  }
  return { threshold, restrictionDays };
}

function normalizeStoredRules(raw: { threshold?: unknown; restrictionDays?: unknown }): ViolationRules {
  const threshold = asInteger(raw.threshold);
  const restrictionDays = asInteger(raw.restrictionDays);
  return {
    threshold:
      threshold !== null && threshold >= MIN_THRESHOLD && threshold <= MAX_THRESHOLD
        ? threshold
        : DEFAULT_THRESHOLD,
    restrictionDays:
      restrictionDays !== null &&
      restrictionDays >= MIN_RESTRICTION_DAYS &&
      restrictionDays <= MAX_RESTRICTION_DAYS
        ? restrictionDays
        : DEFAULT_RESTRICTION_DAYS,
  };
}

export interface ViolationListFilter {
  status?: ViolationStatus;
  page: number;
  pageSize: number;
}

export interface AdminViolationFilter extends ViolationListFilter {
  studentNo?: string;
  roomId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ViolationView {
  id: string;
  type: ViolationType;
  status: ViolationStatus;
  reason: string;
  occurredAt: string;
  resolvedAt: string | null;
  resolutionReason: string | null;
  roomName: string;
  seatNo: string;
  reserveDate: string;
  startAt: string;
  endAt: string;
}

export interface AdminViolationView extends ViolationView {
  student: { id: string; studentNo: string; displayName: string; username: string };
  resolvedBy: string | null;
}

export interface ViolationSummary {
  activeCount: number;
  threshold: number;
  restrictionDays: number;
  restrictionUntil: string | null;
}

export interface ViolationPage<T> {
  summary: ViolationSummary;
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

interface ServiceOptions {
  now?: (() => Date) | undefined;
  logger?: Logger | undefined;
}

export class ViolationService {
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;

  constructor(
    private readonly models: ViolationModels,
    private readonly settings: SettingsService,
    options: ServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger;
  }

  async getRules(): Promise<ViolationRules> {
    const [threshold, restrictionDays] = await Promise.all([
      this.settings.getJson<unknown>(VIOLATION_THRESHOLD_KEY, DEFAULT_THRESHOLD),
      this.settings.getJson<unknown>(VIOLATION_RESTRICTION_DAYS_KEY, DEFAULT_RESTRICTION_DAYS),
    ]);
    return normalizeStoredRules({ threshold, restrictionDays });
  }

  async updateRules(operatorId: string, input: { threshold: unknown; restrictionDays: unknown }) {
    const rules = validateRulesInput(input);
    await this.models.Violation.sequelize!.transaction(async (transaction) => {
      await this.settings.setJson(VIOLATION_THRESHOLD_KEY, rules.threshold, operatorId, transaction);
      await this.settings.setJson(
        VIOLATION_RESTRICTION_DAYS_KEY,
        rules.restrictionDays,
        operatorId,
        transaction,
      );
      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: 'violation.rules_updated',
          resource_type: 'system_setting',
          // Settings have no numeric primary key; 0 is the documented sentinel here.
          resource_id: '0',
          before_json: null,
          after_json: { threshold: rules.threshold, restrictionDays: rules.restrictionDays },
          reason: '更新违约规则',
          request_id: currentRequestId(),
          created_at: this.now(),
        },
        { transaction },
      );
    });
    return rules;
  }

  /** M03 calls this before creating a reservation; the rule lives here, not in M03. */
  assertCanReserve(user: User, now = this.now()): void {
    if (user.restriction_until && user.restriction_until.getTime() > now.getTime()) {
      throw new HttpError(
        403,
        'FORBIDDEN',
        `当前账号处于预约限制期，截止至 ${toBusinessText(user.restriction_until)}`,
      );
    }
  }

  async createFromNoShow(reservationId: string, transaction?: Transaction): Promise<void> {
    if (transaction) {
      await this.createWithTransaction(reservationId, transaction);
      return;
    }
    await this.models.Violation.sequelize!.transaction((owned) =>
      this.createWithTransaction(reservationId, owned),
    );
  }

  private async createWithTransaction(reservationId: string, transaction: Transaction) {
    const reservation = await this.models.Reservation.findByPk(reservationId, { transaction });
    if (!reservation) return;
    if (reservation.status !== 'no_show') return;

    // The caller may already hold the user lock; re-locking inside the same transaction is a
    // no-op, and when called standalone it serialises with revoke/reconcile.
    const user = await this.models.User.findByPk(reservation.user_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) return;

    const rules = await this.getRules();
    const occurredAt = reservation.check_in_deadline;
    try {
      await this.models.Violation.create(
        {
          user_id: String(reservation.user_id),
          reservation_id: String(reservation.id),
          type: 'no_show',
          status: 'active',
          reason: NO_SHOW_REASON,
          occurred_at: occurredAt,
          resolved_by: null,
          resolved_at: null,
          resolution_reason: null,
        },
        { transaction },
      );
    } catch (error) {
      if (error instanceof UniqueConstraintError) return;
      throw error;
    }

    const activeCount = await this.models.Violation.count({
      where: { user_id: reservation.user_id, status: 'active' },
      transaction,
    });
    const next = computeRestriction({
      activeCount,
      threshold: rules.threshold,
      restrictionDays: rules.restrictionDays,
      occurredAt,
      startedAt: user.restriction_started_at,
      until: user.restriction_until,
    });
    user.violation_count = activeCount;
    user.restriction_started_at = next.startedAt;
    user.restriction_until = next.until;
    await user.save({ transaction });
    this.logger?.info('violation.created', { reservationId, activeCount });
  }

  async revoke(operatorId: string, violationId: string, rawReason: string) {
    const reason = (rawReason ?? '').trim();
    if (reason.length < 2 || reason.length > 255) {
      throw fieldError('reason', '撤销原因需为 2-255 个字符');
    }
    const id = violationId.trim();
    if (!/^\d{1,20}$/.test(id)) throw fieldError('id', '违约编号格式不正确');

    return this.models.Violation.sequelize!.transaction(async (transaction) => {
      const violation = await this.models.Violation.findByPk(id, { transaction });
      if (!violation) throw new HttpError(404, 'NOT_FOUND', '违约记录不存在');
      if (violation.status === 'revoked') {
        return { id, status: 'revoked' as const, changed: false };
      }

      const user = await this.models.User.findByPk(violation.user_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) throw new HttpError(404, 'NOT_FOUND', '用户不存在');

      const now = this.now();
      const [affected] = await this.models.Violation.update(
        {
          status: 'revoked',
          resolved_by: operatorId,
          resolved_at: now,
          resolution_reason: reason,
        },
        { where: { id, status: 'active' }, transaction },
      );
      if (affected === 0) {
        return { id, status: 'revoked' as const, changed: false };
      }

      const activeCount = await this.models.Violation.count({
        where: { user_id: violation.user_id, status: 'active' },
        transaction,
      });
      const rules = await this.getRules();
      const next = computeRestriction({
        activeCount,
        threshold: rules.threshold,
        restrictionDays: rules.restrictionDays,
        occurredAt: now,
        startedAt: user.restriction_started_at,
        until: user.restriction_until,
      });
      // computeRestriction clears the interval when the user drops below the threshold and
      // otherwise returns the untouched interval.
      user.violation_count = activeCount;
      if (activeCount < rules.threshold) {
        user.restriction_started_at = null;
        user.restriction_until = null;
      } else {
        user.restriction_started_at = next.startedAt;
        user.restriction_until = next.until;
      }
      await user.save({ transaction });

      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: 'violation.revoked',
          resource_type: 'violation',
          resource_id: id,
          before_json: { status: 'active' },
          after_json: { status: 'revoked', reason },
          reason,
          request_id: currentRequestId(),
          created_at: now,
        },
        { transaction },
      );
      this.logger?.info('violation.revoked', { violationId: id, activeCount });
      return { id, status: 'revoked' as const, changed: true };
    });
  }

  async listMine(
    userId: string,
    filter: ViolationListFilter,
  ): Promise<ViolationPage<ViolationView>> {
    const where: WhereOptions = { user_id: userId };
    if (filter.status) (where as Record<string, unknown>).status = filter.status;
    const { rows, count } = await this.models.Violation.findAndCountAll({
      where,
      include: [
        {
          model: this.models.Reservation,
          as: 'reservation',
          attributes: [
            'room_name_snapshot',
            'seat_no_snapshot',
            'reserve_date',
            'start_at',
            'end_at',
          ],
          required: false,
        },
      ],
      order: [
        ['occurred_at', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (filter.page - 1) * filter.pageSize,
      limit: filter.pageSize,
    });
    return {
      summary: await this.summaryFor(userId),
      items: rows.map((row) => this.toView(row)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: count,
    };
  }

  async listAdmin(
    filter: AdminViolationFilter,
  ): Promise<ViolationPage<AdminViolationView>> {
    const where: Record<string | symbol, unknown> = {};
    if (filter.status) where.status = filter.status;
    const occurredAt: Record<symbol, string> = {};
    if (filter.dateFrom) occurredAt[Op.gte] = `${filter.dateFrom} 00:00:00`;
    if (filter.dateTo) occurredAt[Op.lte] = `${filter.dateTo} 23:59:59`;
    if (Object.getOwnPropertySymbols(occurredAt).length > 0) where.occurred_at = occurredAt;
    if (filter.roomId) where['$reservation.room_id$'] = filter.roomId;
    if (filter.studentNo) where['$user.student_no$'] = filter.studentNo;

    const { rows, count } = await this.models.Violation.findAndCountAll({
      where: where as WhereOptions,
      include: [
        {
          model: this.models.User,
          as: 'user',
          attributes: ['id', 'student_no', 'display_name', 'username'],
          required: true,
        },
        {
          model: this.models.Reservation,
          as: 'reservation',
          attributes: ['room_id', 'room_name_snapshot', 'seat_no_snapshot', 'reserve_date', 'start_at', 'end_at'],
          required: false,
        },
      ],
      order: [
        ['occurred_at', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (filter.page - 1) * filter.pageSize,
      limit: filter.pageSize,
      subQuery: false,
    });

    const summary = await this.summaryFor();
    return {
      summary,
      items: rows.map((row) => this.toAdminView(row)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: count,
    };
  }

  private async summaryFor(userId?: string): Promise<ViolationSummary> {
    const rules = await this.getRules();
    if (!userId) {
      const aggregate = await this.models.Violation.aggregate('user_id', 'count', {
        where: { status: 'active' },
        distinct: true,
      });
      return {
        activeCount: Number(aggregate ?? 0),
        threshold: rules.threshold,
        restrictionDays: rules.restrictionDays,
        restrictionUntil: null,
      };
    }
    const user = await this.models.User.findByPk(userId);
    const until = user?.restriction_until ?? null;
    return {
      activeCount: Number(user?.violation_count ?? 0),
      threshold: rules.threshold,
      restrictionDays: rules.restrictionDays,
      restrictionUntil: until && until.getTime() > this.now().getTime() ? toBusinessIso(until) : null,
    };
  }

  private toView(violation: Violation): ViolationView {
    const reservation = (violation as unknown as { reservation?: Reservation }).reservation;
    return {
      id: String(violation.id),
      type: violation.type,
      status: violation.status,
      reason: violation.reason,
      occurredAt: toBusinessIso(violation.occurred_at),
      resolvedAt: violation.resolved_at ? toBusinessIso(violation.resolved_at) : null,
      resolutionReason: violation.resolution_reason,
      roomName: reservation?.room_name_snapshot ?? '—',
      seatNo: reservation?.seat_no_snapshot ?? '—',
      reserveDate: reservation?.reserve_date ?? '—',
      startAt: reservation ? toBusinessIso(reservation.start_at) : '',
      endAt: reservation ? toBusinessIso(reservation.end_at) : '',
    };
  }

  private toAdminView(violation: Violation): AdminViolationView {
    const user = (violation as unknown as { user?: User }).user;
    return {
      ...this.toView(violation),
      student: {
        id: String(user?.id ?? violation.user_id),
        studentNo: String(user?.student_no ?? ''),
        displayName: String(user?.display_name ?? ''),
        username: String(user?.username ?? ''),
      },
      resolvedBy: violation.resolved_by ? String(violation.resolved_by) : null,
    };
  }

  /** Recomputes cached counters and restriction intervals from the violation table. */
  async reconcile(now = this.now()): Promise<{ scanned: number; fixed: number }> {
    const users = await this.models.User.findAll({ attributes: ['id'] });
    const rules = await this.getRules();
    let fixed = 0;
    for (const stub of users) {
      const userId = String(stub.id);
      const activeCount = await this.models.Violation.count({
        where: { user_id: userId, status: 'active' },
      });
      const latest = await this.models.Violation.findOne({
        where: { user_id: userId, status: 'active' },
        order: [['occurred_at', 'DESC']],
      });
      const user = await this.models.User.findByPk(userId);
      if (!user) continue;
      const expected = computeRestriction({
        activeCount,
        threshold: rules.threshold,
        restrictionDays: rules.restrictionDays,
        occurredAt: latest ? latest.occurred_at : now,
        startedAt: user.restriction_started_at,
        until: user.restriction_until,
      });
      const same =
        Number(user.violation_count) === activeCount &&
        this.sameInstant(user.restriction_started_at, expected.startedAt) &&
        this.sameInstant(user.restriction_until, expected.until);
      if (same) continue;
      user.violation_count = activeCount;
      user.restriction_started_at = expected.startedAt;
      user.restriction_until = expected.until;
      await user.save();
      fixed += 1;
    }
    return { scanned: users.length, fixed };
  }

  private sameInstant(left: Date | null, right: Date | null): boolean {
    if (!left || !right) return left === right;
    return left.getTime() === right.getTime();
  }
}
