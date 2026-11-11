import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { StudyRoom } from './study-room.model.js';

export type SeatStatus = 'available' | 'maintenance' | 'disabled';

export class Seat extends Model<InferAttributes<Seat>, InferCreationAttributes<Seat>> {
  declare id: CreationOptional<string>;
  declare room_id: ForeignKey<StudyRoom['id']>;
  declare batch_prefix: string;
  declare seat_no: string;
  declare row_no: number;
  declare column_no: number;
  declare status: SeatStatus;
  declare bookable_from: string;
  declare remark: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initSeatModel(sequelize: Sequelize) {
  Seat.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      room_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: StudyRoom, key: 'id' },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
      },
      batch_prefix: { type: DataTypes.STRING(8), allowNull: false },
      seat_no: { type: DataTypes.STRING(32), allowNull: false },
      row_no: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      column_no: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      status: {
        type: DataTypes.ENUM('available', 'maintenance', 'disabled'),
        allowNull: false,
        defaultValue: 'available',
      },
      bookable_from: { type: DataTypes.DATEONLY, allowNull: false },
      remark: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'seats',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return Seat;
}
