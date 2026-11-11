import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export class DailySlotMetric extends Model<
  InferAttributes<DailySlotMetric>,
  InferCreationAttributes<DailySlotMetric>
> {
  declare id: CreationOptional<string>;
  declare stat_date: string;
  declare room_id: string;
  declare room_name_snapshot: string;
  declare slot_id: string;
  declare slot_label: string;
  declare slot_start_time: string;
  declare slot_end_time: string;
  declare bookable_seat_count: number;
  declare available_seat_minutes: number;
  declare reservation_count: CreationOptional<number>;
  declare checked_in_count: CreationOptional<number>;
  declare no_show_count: CreationOptional<number>;
  declare outage_cancelled_count: CreationOptional<number>;
  declare used_seat_minutes: CreationOptional<number>;
  declare finalized_at: Date | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initDailySlotMetricModel(sequelize: Sequelize) {
  DailySlotMetric.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      stat_date: { type: DataTypes.DATEONLY, allowNull: false },
      room_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      room_name_snapshot: { type: DataTypes.STRING(64), allowNull: false },
      slot_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      slot_label: { type: DataTypes.STRING(32), allowNull: false },
      slot_start_time: { type: DataTypes.TIME, allowNull: false },
      slot_end_time: { type: DataTypes.TIME, allowNull: false },
      bookable_seat_count: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      available_seat_minutes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      reservation_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      checked_in_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      no_show_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      outage_cancelled_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      used_seat_minutes: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      finalized_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'daily_slot_metrics',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return DailySlotMetric;
}
