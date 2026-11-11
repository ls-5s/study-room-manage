/**
 * M04 owns violations and the reservation restriction window. M03 only knows that a
 * reservation became a no-show; wiring the real implementation later must not change the
 * job or the reservation service.
 */
export interface ViolationPort {
  createFromNoShow(reservationId: string): Promise<void>;
}

export class NoopViolationPort implements ViolationPort {
  async createFromNoShow(): Promise<void> {
    // Intentionally empty: violation creation lands with the violation module (M04).
  }
}
