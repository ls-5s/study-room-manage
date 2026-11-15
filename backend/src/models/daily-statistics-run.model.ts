import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export class DailyStatisticsRun extends Model<
  InferAttributes<DailyStatisticsRun>,
  InferCreationAttributes<DailyStatisticsRun>
> {
  declare stat_date: string;
  declare capacity_snapshotted_at: Date;
  declare finalized_at: Date | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initDailyStatisticsRunModel(sequelize: Sequelize) {
  DailyStatisticsRun.init(
    {
      stat_date: { type: DataTypes.DATEONLY, primaryKey: true },
      capacity_snapshotted_at: { type: DataTypes.DATE, allowNull: false },
      finalized_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'daily_statistics_runs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return DailyStatisticsRun;
}
