import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export class SystemSetting extends Model<
  InferAttributes<SystemSetting>,
  InferCreationAttributes<SystemSetting>
> {
  declare key: string;
  declare value_json: unknown;
  declare description: string | null;
  declare updated_by: string | null;
  declare updated_at: CreationOptional<Date>;
}

export function initSystemSettingModel(sequelize: Sequelize) {
  SystemSetting.init(
    {
      key: { type: DataTypes.STRING(100), primaryKey: true },
      value_json: { type: DataTypes.JSON, allowNull: false },
      description: { type: DataTypes.STRING(255), allowNull: true },
      updated_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'system_settings',
      timestamps: false,
      underscored: true,
    },
  );
  return SystemSetting;
}
