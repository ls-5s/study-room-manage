import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export type CheckInMethod = 'qr' | 'manual';

export class CheckIn extends Model<InferAttributes<CheckIn>, InferCreationAttributes<CheckIn>> {
  declare id: CreationOptional<string>;
  declare reservation_id: string;
  declare checked_in_at: Date;
  declare business_date: string;
  declare method: CheckInMethod;
  declare nonce: string | null;
  declare operator_id: string | null;
  declare remark: string | null;
  declare created_at: CreationOptional<Date>;
}

export function initCheckInModel(sequelize: Sequelize) {
  CheckIn.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      checked_in_at: { type: DataTypes.DATE, allowNull: false },
      business_date: { type: DataTypes.DATEONLY, allowNull: false },
      method: { type: DataTypes.ENUM('qr', 'manual'), allowNull: false },
      nonce: { type: DataTypes.CHAR(36), allowNull: true },
      operator_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      remark: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'check_ins',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
    },
  );
  return CheckIn;
}
