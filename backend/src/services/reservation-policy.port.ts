import type { User } from '../models/user.model.js';

/**
 * The "can this user create a reservation right now" rule belongs to the violation module.
 * M03 only depends on this narrow port so the restriction logic lives in one place.
 */
export interface ReservationPolicyPort {
  assertCanReserve(user: User, now?: Date): void;
}

export class AllowAllReservationPolicy implements ReservationPolicyPort {
  assertCanReserve(): void {
    // No restriction configured (tests, or M04 not wired).
  }
}
