import { Op } from 'sequelize';
import type { Logger } from '../lib/logger.js';
import { classifyDeadline } from '../lib/reservation-time.js';
import type { ReservationModels } from '../models/reservation-models.js';
import type { ViolationPort } from '../services/violation.port.js';

export interface ReservationStateJobResult {
  scanned: number;
  noShow: number;
  outageCancelled: number;
  completed: number;
  failed: number;
}

interface JobOptions {
  now?: (() => Date) | undefined;
  batchSize?: number | undefined;
  maxRounds?: number | undefined;
  logger?: Logger | undefined;
}

const OUTAGE_REASON = '签到服务中断期间到期，不计违约';

export class ReservationStateJob {
  private readonly now: () => Date;
  private readonly batchSize: number;
  private readonly maxRounds: number;
  private readonly logger: Logger | undefined;
  private running = false;
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(
    private readonly models: ReservationModels,
    private readonly violations: ViolationPort,
    options: JobOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.batchSize = options.batchSize ?? 200;
    this.maxRounds = options.maxRounds ?? 20;
    this.logger = options.logger;
  }

  async run(now = this.now()): Promise<ReservationStateJobResult> {
    const result: ReservationStateJobResult = {
      scanned: 0,
      noShow: 0,
      outageCancelled: 0,
      completed: 0,
      failed: 0,
    };

    for (let round = 0; round < this.maxRounds; round += 1) {
      const candidates = await this.models.Reservation.findAll({
        attributes: ['id', 'check_in_deadline'],
        where: { status: 'pending', check_in_deadline: { [Op.lt]: now } },
        order: [['check_in_deadline', 'ASC']],
        limit: this.batchSize,
      });
      if (candidates.length === 0) break;
      result.scanned += candidates.length;

      let progressed = 0;
      for (const candidate of candidates) {
        const id = String(candidate.id);
        try {
          const kind = classifyDeadline(candidate.check_in_deadline, now);
          if (kind === 'future') continue;
          if (kind === 'due') {
            if (await this.markNoShow(id, now)) {
              result.noShow += 1;
              progressed += 1;
            }
          } else if (await this.markOutageCancelled(id, now)) {
            result.outageCancelled += 1;
            progressed += 1;
          }
        } catch {
          result.failed += 1;
          this.logger?.error('job.reservation_state_failed', { reservationId: id });
        }
      }
      if (progressed === 0) break;
    }

    for (let round = 0; round < this.maxRounds; round += 1) {
      const candidates = await this.models.Reservation.findAll({
        attributes: ['id'],
        where: { status: 'checked_in', end_at: { [Op.lte]: now } },
        order: [['end_at', 'ASC']],
        limit: this.batchSize,
      });
      if (candidates.length === 0) break;
      let progressed = 0;
      for (const candidate of candidates) {
        const id = String(candidate.id);
        try {
          if (await this.markCompleted(id, now)) {
            result.completed += 1;
            progressed += 1;
          }
        } catch {
          result.failed += 1;
          this.logger?.error('job.reservation_complete_failed', { reservationId: id });
        }
      }
      if (progressed === 0) break;
    }

    if (result.outageCancelled > 0) {
      this.logger?.error('job.degraded', { cancelled: result.outageCancelled });
    }
    this.logger?.info('job.completed', {
      job: 'reservation-state',
      scanned: result.scanned,
      noShow: result.noShow,
      cancelled: result.outageCancelled,
      completed: result.completed,
      failed: result.failed,
    });
    return result;
  }

  private async markNoShow(id: string, now: Date): Promise<boolean> {
    return this.models.Reservation.sequelize!.transaction(async (transaction) => {
      const snapshot = await this.models.Reservation.findByPk(id, { transaction });
      if (!snapshot || snapshot.status !== 'pending') return false;

      // Same lock order as booking: user row first.
      await this.models.User.findByPk(snapshot.user_id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const [affected] = await this.models.Reservation.update(
        { status: 'no_show' },
        { where: { id, status: 'pending' }, transaction },
      );
      if (affected === 0) return false;

      await this.models.ReservationStatusLog.create(
        {
          reservation_id: id,
          from_status: 'pending',
          to_status: 'no_show',
          actor_type: 'system',
          actor_id: null,
          reason: null,
          occurred_at: now,
        },
        { transaction },
      );

      // Joins the caller's transaction: the violation must commit or roll back together with
      // the status change, and the caller already holds the user row lock.
      await this.violations.createFromNoShow(id, transaction);
      return true;
    });
  }

  private async markOutageCancelled(id: string, now: Date): Promise<boolean> {
    return this.models.Reservation.sequelize!.transaction(async (transaction) => {
      const [affected] = await this.models.Reservation.update(
        {
          status: 'cancelled',
          cancel_reason: OUTAGE_REASON,
          cancelled_by: null,
          cancelled_at: now,
        },
        { where: { id, status: 'pending' }, transaction },
      );
      if (affected === 0) return false;
      await this.models.ReservationStatusLog.create(
        {
          reservation_id: id,
          from_status: 'pending',
          to_status: 'cancelled',
          actor_type: 'system',
          actor_id: null,
          reason: OUTAGE_REASON,
          occurred_at: now,
        },
        { transaction },
      );
      return true;
    });
  }

  private async markCompleted(id: string, now: Date): Promise<boolean> {
    return this.models.Reservation.sequelize!.transaction(async (transaction) => {
      const [affected] = await this.models.Reservation.update(
        { status: 'completed' },
        { where: { id, status: 'checked_in' }, transaction },
      );
      if (affected === 0) return false;
      await this.models.ReservationStatusLog.create(
        {
          reservation_id: id,
          from_status: 'checked_in',
          to_status: 'completed',
          actor_type: 'system',
          actor_id: null,
          reason: null,
          occurred_at: now,
        },
        { transaction },
      );
      return true;
    });
  }

  start(intervalMs = 60_000): void {
    if (this.timer) return;
    const tick = async () => {
      if (this.running) return;
      this.running = true;
      try {
        await this.run();
      } catch {
        this.logger?.error('job.reservation_state_crashed');
      } finally {
        this.running = false;
      }
    };
    void tick();
    this.timer = setInterval(() => void tick(), intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}
