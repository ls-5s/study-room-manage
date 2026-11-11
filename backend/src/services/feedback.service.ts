import { Op, col, fn, literal, type WhereOptions } from 'sequelize';
import { combineBusinessDateTime } from '../lib/reservation-time.js';
import { toBusinessIso } from '../lib/reservation-time.js';
import type { Logger } from '../lib/logger.js';
import { HttpError } from '../middleware/errors.js';
import type { FeedbackModels } from '../models/feedback-models.js';
import type {
  FeedbackStatus,
  FeedbackTicket,
  FeedbackType,
} from '../models/feedback-ticket.model.js';
import type { User } from '../models/user.model.js';

export const FEEDBACK_TYPES: readonly FeedbackType[] = [
  'occupied_seat',
  'equipment',
  'environment',
  'other',
];
export const FEEDBACK_STATUSES: readonly FeedbackStatus[] = [
  'pending',
  'processing',
  'resolved',
  'rejected',
];

export const FEEDBACK_TRANSITIONS: Readonly<Record<FeedbackStatus, readonly FeedbackStatus[]>> = {
  pending: ['processing', 'rejected'],
  processing: ['resolved', 'rejected'],
  resolved: [],
  rejected: [],
};

export interface FeedbackCreateInput {
  type: FeedbackType;
  description: string;
  roomId?: string;
  seatId?: string;
}

export interface FeedbackTransitionInput {
  status: FeedbackStatus;
  result: string | null;
}

export interface FeedbackListFilter {
  status?: FeedbackStatus;
  type?: FeedbackType;
  page: number;
  pageSize: number;
}

export interface AdminFeedbackListFilter extends FeedbackListFilter {
  roomId?: string;
  dateFrom?: string;
  dateTo?: string;
  studentNo?: string;
  keyword?: string;
}

export interface FeedbackSummaryView {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  roomName: string | null;
  seatNo: string | null;
  createdAt: string;
  processedAt: string | null;
  closedAt: string | null;
}

export interface StudentFeedbackView extends FeedbackSummaryView {
  roomId: string | null;
  seatId: string | null;
  description: string;
  result: string | null;
}

export interface AdminFeedbackView extends StudentFeedbackView {
  descriptionExcerpt: string;
  student: {
    id: string;
    studentNo: string;
    username: string;
    displayName: string;
  };
}

export interface FeedbackTimelineItem {
  id: string;
  action: string;
  fromStatus: FeedbackStatus | null;
  toStatus: FeedbackStatus;
  occurredAt: string;
  operator: { id: string; displayName: string } | null;
}

export interface AdminFeedbackDetail extends AdminFeedbackView {
  handledBy: { id: string; displayName: string } | null;
  timeline: FeedbackTimelineItem[];
}

export interface FeedbackStatusSummary {
  pending: number;
  processing: number;
  resolved: number;
  rejected: number;
  total: number;
}

export interface FeedbackPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminFeedbackPage extends FeedbackPage<AdminFeedbackView> {
  summary: FeedbackStatusSummary;
}

interface ServiceOptions {
  now?: (() => Date) | undefined;
  logger?: Logger | undefined;
}

type TicketAssociations = {
  submitter?: User;
  handler?: User;
};

function fieldError(field: string, message: string): HttpError {
  return new HttpError(422, 'VALIDATION_ERROR', '请检查输入内容', {
    fields: { [field]: message },
  });
}

function normalizeTicketId(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{1,20}$/.test(value.trim())) {
    throw fieldError('id', '工单编号格式不正确');
  }
  return value.trim();
}

function normalizeOptionalId(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^\d{1,20}$/.test(value.trim())) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) return value.trim();
  }
  throw fieldError(field, '编号格式不正确');
}

function normalizeDescription(value: unknown): string {
  if (typeof value !== 'string') {
    throw fieldError('description', '问题描述必须为文本');
  }
  const description = value.trim();
  if (description.length < 5 || description.length > 1000) {
    throw fieldError('description', '问题描述需为 5-1000 个字符');
  }
  return description;
}

function normalizeResult(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 2) {
    throw fieldError('result', '处理结果需为 2-1000 个字符');
  }
  const result = value.trim();
  if (result.length > 1000) {
    throw fieldError('result', '处理结果需为 2-1000 个字符');
  }
  return result;
}

export function validateFeedbackCreateInput(input: {
  type?: unknown;
  roomId?: unknown;
  seatId?: unknown;
  description?: unknown;
}): FeedbackCreateInput {
  if (typeof input.type !== 'string' || !FEEDBACK_TYPES.includes(input.type as FeedbackType)) {
    throw fieldError('type', '反馈类型无效');
  }

  const type = input.type as FeedbackType;
  const roomId = normalizeOptionalId(input.roomId, 'roomId');
  const seatId = normalizeOptionalId(input.seatId, 'seatId');
  const description = normalizeDescription(input.description);

  if (type === 'occupied_seat' && (!roomId || !seatId)) {
    throw fieldError('roomId', '占座举报必须选择自习室和座位');
  }
  if (seatId && !roomId) {
    throw fieldError('roomId', '选择座位时必须同时选择自习室');
  }

  return {
    type,
    description,
    ...(roomId ? { roomId } : {}),
    ...(seatId ? { seatId } : {}),
  };
}

export function validateFeedbackTransition(
  currentStatus: FeedbackStatus,
  rawStatus: unknown,
  rawResult: unknown,
): FeedbackTransitionInput {
  if (typeof rawStatus !== 'string' || !FEEDBACK_STATUSES.includes(rawStatus as FeedbackStatus)) {
    throw fieldError('status', '工单状态无效');
  }

  const status = rawStatus as FeedbackStatus;
  if (!FEEDBACK_TRANSITIONS[currentStatus].includes(status)) {
    throw new HttpError(409, 'CONFLICT', '当前工单状态不允许执行该操作');
  }

  if (status === 'processing') {
    return { status, result: null };
  }
  return { status, result: normalizeResult(rawResult) };
}

function emptySummary(): FeedbackStatusSummary {
  return { pending: 0, processing: 0, resolved: 0, rejected: 0, total: 0 };
}

function descriptionExcerpt(description: string): string {
  const compact = description.replace(/\s+/g, ' ').trim();
  return compact.length > 110 ? `${compact.slice(0, 110)}…` : compact;
}

export class FeedbackService {
  private readonly now: () => Date;
  private readonly logger: Logger | undefined;

  constructor(
    private readonly models: FeedbackModels,
    options: ServiceOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.logger = options.logger;
  }

  async create(userId: string, rawInput: Record<string, unknown>) {
    const input = validateFeedbackCreateInput(rawInput);
    const room = input.roomId
      ? await this.models.StudyRoom.findByPk(input.roomId, { attributes: ['id', 'name'] })
      : null;
    if (input.roomId && !room) throw fieldError('roomId', '所选自习室不存在');

    const seat = input.seatId
      ? await this.models.Seat.findByPk(input.seatId, {
          attributes: ['id', 'room_id', 'seat_no'],
        })
      : null;
    if (input.seatId && !seat) throw fieldError('seatId', '所选座位不存在');
    if (seat && String(seat.room_id) !== input.roomId) {
      throw fieldError('seatId', '所选座位不属于该自习室');
    }

    const now = this.now();
    const ticket = await this.models.FeedbackTicket.create({
      user_id: userId,
      room_id: input.roomId ?? null,
      seat_id: input.seatId ?? null,
      room_name_snapshot: room?.name ?? null,
      seat_no_snapshot: seat?.seat_no ?? null,
      type: input.type,
      description: input.description,
      status: 'pending',
      result: null,
      handled_by: null,
      processed_at: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
    });
    const id = String(ticket.id);
    this.logger?.info('feedback.created', { feedbackTicketId: id, type: input.type });
    return { id, status: ticket.status, createdAt: toBusinessIso(ticket.created_at) };
  }

  async listMine(
    userId: string,
    filter: FeedbackListFilter,
  ): Promise<FeedbackPage<FeedbackSummaryView>> {
    const where: WhereOptions = { user_id: userId };
    if (filter.status) (where as Record<string, unknown>).status = filter.status;
    if (filter.type) (where as Record<string, unknown>).type = filter.type;

    const { rows, count } = await this.models.FeedbackTicket.findAndCountAll({
      where,
      order: [
        ['created_at', 'DESC'],
        ['id', 'DESC'],
      ],
      offset: (filter.page - 1) * filter.pageSize,
      limit: filter.pageSize,
    });

    return {
      items: rows.map((ticket) => this.toStudentSummary(ticket)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: count,
    };
  }

  async getMine(userId: string, rawId: string): Promise<StudentFeedbackView> {
    const id = normalizeTicketId(rawId);
    const ticket = await this.models.FeedbackTicket.findOne({ where: { id, user_id: userId } });
    if (!ticket) throw new HttpError(404, 'NOT_FOUND', '反馈工单不存在');
    return this.toStudentView(ticket);
  }

  async listAdmin(filter: AdminFeedbackListFilter): Promise<AdminFeedbackPage> {
    const where: Record<string | symbol, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.type) where.type = filter.type;
    if (filter.roomId) where.room_id = filter.roomId;
    if (filter.studentNo) where['$submitter.student_no$'] = filter.studentNo;

    if (filter.dateFrom || filter.dateTo) {
      const createdAt: Record<symbol, Date> = {};
      if (filter.dateFrom) createdAt[Op.gte] = combineBusinessDateTime(filter.dateFrom, '00:00');
      if (filter.dateTo) createdAt[Op.lte] = combineBusinessDateTime(filter.dateTo, '23:59:59');
      where.created_at = createdAt;
    }

    if (filter.keyword) {
      const keyword = `%${filter.keyword}%`;
      where[Op.or] = [
        { description: { [Op.like]: keyword } },
        { room_name_snapshot: { [Op.like]: keyword } },
        { seat_no_snapshot: { [Op.like]: keyword } },
      ];
    }

    const [result, summary] = await Promise.all([
      this.models.FeedbackTicket.findAndCountAll({
        where: where as WhereOptions,
        include: [
          {
            model: this.models.User,
            as: 'submitter',
            attributes: ['id', 'student_no', 'username', 'display_name'],
            required: true,
          },
        ],
        order: [
          [
            literal(
              "CASE WHEN `FeedbackTicket`.`status` = 'pending' THEN 0 WHEN `FeedbackTicket`.`status` = 'processing' THEN 1 ELSE 2 END",
            ),
            'ASC',
          ],
          ['created_at', 'ASC'],
          ['id', 'ASC'],
        ],
        offset: (filter.page - 1) * filter.pageSize,
        limit: filter.pageSize,
        subQuery: false,
      }),
      this.summary(),
    ]);

    return {
      items: result.rows.map((ticket) => this.toAdminView(ticket)),
      page: filter.page,
      pageSize: filter.pageSize,
      total: result.count,
      summary,
    };
  }

  async getAdmin(rawId: string): Promise<AdminFeedbackDetail> {
    const id = normalizeTicketId(rawId);
    const ticket = await this.models.FeedbackTicket.findByPk(id, {
      include: [
        {
          model: this.models.User,
          as: 'submitter',
          attributes: ['id', 'student_no', 'username', 'display_name'],
          required: true,
        },
        {
          model: this.models.User,
          as: 'handler',
          attributes: ['id', 'display_name'],
          required: false,
        },
      ],
    });
    if (!ticket) throw new HttpError(404, 'NOT_FOUND', '反馈工单不存在');

    const logs = await this.models.AuditLog.findAll({
      where: { resource_type: 'feedback_ticket', resource_id: id },
      order: [
        ['created_at', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    const operatorIds = [...new Set(logs.map((log) => String(log.operator_id)))];
    const operators =
      operatorIds.length > 0
        ? await this.models.User.findAll({
            where: { id: { [Op.in]: operatorIds } },
            attributes: ['id', 'display_name'],
          })
        : [];
    const operatorMap = new Map(
      operators.map((operator) => [
        String(operator.id),
        { id: String(operator.id), displayName: operator.display_name },
      ]),
    );

    return {
      ...this.toAdminView(ticket),
      handledBy: this.toRelatedUser((ticket as unknown as TicketAssociations).handler ?? null),
      timeline: logs.map((log) => {
        const before = log.before_json as { status?: FeedbackStatus } | null;
        const after = log.after_json as { status?: FeedbackStatus } | null;
        return {
          id: String(log.id),
          action: log.action,
          fromStatus: before?.status ?? null,
          toStatus: after?.status ?? 'pending',
          occurredAt: toBusinessIso(log.created_at),
          operator: operatorMap.get(String(log.operator_id)) ?? null,
        };
      }),
    };
  }

  async transition(
    operatorId: string,
    rawId: string,
    rawStatus: unknown,
    rawResult: unknown,
  ): Promise<AdminFeedbackDetail> {
    const id = normalizeTicketId(rawId);
    await this.models.FeedbackTicket.sequelize!.transaction(async (transaction) => {
      const ticket = await this.models.FeedbackTicket.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!ticket) throw new HttpError(404, 'NOT_FOUND', '反馈工单不存在');

      const beforeStatus = ticket.status;
      const input = validateFeedbackTransition(beforeStatus, rawStatus, rawResult);
      const now = this.now();
      ticket.status = input.status;
      ticket.handled_by = operatorId;
      if (input.status === 'processing') {
        ticket.processed_at ??= now;
        ticket.closed_at = null;
        ticket.result = null;
      } else {
        ticket.closed_at = now;
        ticket.result = input.result;
      }
      await ticket.save({ transaction });

      await this.models.AuditLog.create(
        {
          operator_id: operatorId,
          action: `feedback_ticket.${input.status}`,
          resource_type: 'feedback_ticket',
          resource_id: id,
          before_json: { status: beforeStatus, type: ticket.type },
          after_json: { status: input.status, type: ticket.type },
          reason: null,
          request_id: null,
          created_at: now,
        },
        { transaction },
      );
    });

    this.logger?.info('feedback.transitioned', {
      feedbackTicketId: id,
      status: String(rawStatus),
    });
    return this.getAdmin(id);
  }

  private async summary(): Promise<FeedbackStatusSummary> {
    const rows = (await this.models.FeedbackTicket.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    })) as unknown as { status: FeedbackStatus; count: string | number }[];
    const summary = emptySummary();
    for (const row of rows) {
      const count = Number(row.count);
      summary[row.status] = count;
      summary.total += count;
    }
    return summary;
  }

  private toStudentSummary(ticket: FeedbackTicket): FeedbackSummaryView {
    return {
      id: String(ticket.id),
      type: ticket.type,
      status: ticket.status,
      roomName: ticket.room_name_snapshot,
      seatNo: ticket.seat_no_snapshot,
      createdAt: toBusinessIso(ticket.created_at),
      processedAt: ticket.processed_at ? toBusinessIso(ticket.processed_at) : null,
      closedAt: ticket.closed_at ? toBusinessIso(ticket.closed_at) : null,
    };
  }

  private toStudentView(ticket: FeedbackTicket): StudentFeedbackView {
    return {
      ...this.toStudentSummary(ticket),
      roomId: ticket.room_id ? String(ticket.room_id) : null,
      seatId: ticket.seat_id ? String(ticket.seat_id) : null,
      description: ticket.description,
      result: ticket.result,
    };
  }

  private toAdminView(ticket: FeedbackTicket): AdminFeedbackView {
    const submitter = (ticket as unknown as TicketAssociations).submitter;
    return {
      ...this.toStudentView(ticket),
      descriptionExcerpt: descriptionExcerpt(ticket.description),
      student: {
        id: String(submitter?.id ?? ticket.user_id),
        studentNo: String(submitter?.student_no ?? ''),
        username: String(submitter?.username ?? ''),
        displayName: String(submitter?.display_name ?? ''),
      },
    };
  }

  private toRelatedUser(user: User | null) {
    return user ? { id: String(user.id), displayName: user.display_name } : null;
  }
}
