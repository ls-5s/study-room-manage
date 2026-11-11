import type { Transaction } from 'sequelize';

/**
 * M04 owns violations and the reservation restriction window. M03 only knows that a
 * reservation became a no-show; wiring the real implementation later must not change the
 * job or the reservation service.
 *
 * The caller passes its transaction so the violation is written atomically with the
 * `pending -> no_show` transition. An implementation must never open its own transaction
 * while this parameter is present: the caller already holds the `users` row lock.
 */
export interface ViolationPort {
  createFromNoShow(reservationId: string, transaction?: Transaction): Promise<void>;
}

export class NoopViolationPort implements ViolationPort {
  async createFromNoShow(): Promise<void> {
    // Intentionally empty: kept for tests that do not wire M04.
  }
}
