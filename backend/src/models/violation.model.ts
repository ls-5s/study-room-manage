import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export type ViolationType = 'no_show';
export type ViolationStatus = 'active' | 'revoked';

export class Violation extends Model<InferAttributes<Violation>, InferCreationAttributes<Violation>> {
  declare id: CreationOptional<string>;
  declare user_id: string;
  declare reservation_id: string;
  declare type: CreationOptional<ViolationType>;
  declare status: CreationOptional<ViolationStatus>;
  declare reason: string;
  declare occurred_at: Date;
  declare resolved_by: string | null;
  declare resolved_at: Date | null;
  declare resolution_reason: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initViolationModel(sequelize: Sequelize) {
  Violation.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      reservation_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      type: { type: DataTypes.ENUM('no_show'), allowNull: false, defaultValue: 'no_show' },
      status: {
        type: DataTypes.ENUM('active', 'revoked'),
        allowNull: false,
        defaultValue: 'active',
      },
      reason: { type: DataTypes.STRING(255), allowNull: false },
      occurred_at: { type: DataTypes.DATE, allowNull: false },
      resolved_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      resolved_at: { type: DataTypes.DATE, allowNull: true },
      resolution_reason: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'violations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return Violation;
}
