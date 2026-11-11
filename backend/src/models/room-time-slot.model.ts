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

export type RoomTimeSlotStatus = 'active' | 'inactive';

export class RoomTimeSlot extends Model<
  InferAttributes<RoomTimeSlot>,
  InferCreationAttributes<RoomTimeSlot>
> {
  declare id: CreationOptional<string>;
  declare room_id: ForeignKey<StudyRoom['id']>;
  declare label: string;
  declare start_time: string;
  declare end_time: string;
  declare status: RoomTimeSlotStatus;
  declare bookable_from: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initRoomTimeSlotModel(sequelize: Sequelize) {
  RoomTimeSlot.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      room_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: StudyRoom, key: 'id' },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
      },
      label: { type: DataTypes.STRING(32), allowNull: false },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
      },
      bookable_from: { type: DataTypes.DATEONLY, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'room_time_slots',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return RoomTimeSlot;
}
