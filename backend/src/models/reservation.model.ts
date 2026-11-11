import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export type ReservationStatus = 'pending' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';

export const ACTIVE_RESERVATION_STATUSES: readonly ReservationStatus[] = ['pending', 'checked_in'];

// `active_slot_key` is a STORED generated column maintained by MySQL; it is intentionally
// absent from this model so the application can never write it and drift from the database.
export class Reservation extends Model<
  InferAttributes<Reservation>,
  InferCreationAttributes<Reservation>
> {
  declare id: CreationOptional<string>;
  declare user_id: string;
  declare room_id: string;
  declare seat_id: string;
  declare slot_id: string;
  declare room_name_snapshot: string;
  declare room_location_snapshot: string;
  declare seat_no_snapshot: string;
  declare reserve_date: string;
  declare start_at: Date;
  declare end_at: Date;
  declare check_in_open_at: Date;
  declare check_in_deadline: Date;
  declare status: CreationOptional<ReservationStatus>;
  declare idempotency_key: string | null;
  declare cancel_reason: string | null;
  declare cancelled_by: string | null;
  declare cancelled_at: Date | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initReservationModel(sequelize: Sequelize) {
  Reservation.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      room_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      seat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      slot_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      room_name_snapshot: { type: DataTypes.STRING(64), allowNull: false },
      room_location_snapshot: { type: DataTypes.STRING(128), allowNull: false },
      seat_no_snapshot: { type: DataTypes.STRING(32), allowNull: false },
      reserve_date: { type: DataTypes.DATEONLY, allowNull: false },
      start_at: { type: DataTypes.DATE, allowNull: false },
      end_at: { type: DataTypes.DATE, allowNull: false },
      check_in_open_at: { type: DataTypes.DATE, allowNull: false },
      check_in_deadline: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'checked_in', 'completed', 'cancelled', 'no_show'),
        allowNull: false,
        defaultValue: 'pending',
      },
      idempotency_key: { type: DataTypes.STRING(64), allowNull: true },
      cancel_reason: { type: DataTypes.STRING(255), allowNull: true },
      cancelled_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      cancelled_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'reservations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return Reservation;
}
