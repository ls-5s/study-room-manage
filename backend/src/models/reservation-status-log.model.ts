import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import type { ReservationStatus } from './reservation.model.js';

export type StatusLogActorType = 'user' | 'admin' | 'system';

export class ReservationStatusLog extends Model<
  InferAttributes<ReservationStatusLog>,
  InferCreationAttributes<ReservationStatusLog>
> {
  declare id: CreationOptional<string>;
  declare reservation_id: string;
  declare from_status: ReservationStatus | null;
  declare to_status: ReservationStatus;
  declare actor_type: StatusLogActorType;
  declare actor_id: string | null;
  declare reason: string | null;
  declare occurred_at: Date;
}

export function initReservationStatusLogModel(sequelize: Sequelize) {
  ReservationStatusLog.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      from_status: {
        type: DataTypes.ENUM('pending', 'checked_in', 'completed', 'cancelled', 'no_show'),
        allowNull: true,
      },
      to_status: {
        type: DataTypes.ENUM('pending', 'checked_in', 'completed', 'cancelled', 'no_show'),
        allowNull: false,
      },
      actor_type: { type: DataTypes.ENUM('user', 'admin', 'system'), allowNull: false },
      actor_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      occurred_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'reservation_status_logs',
      timestamps: false,
      underscored: true,
    },
  );
  return ReservationStatusLog;
}
