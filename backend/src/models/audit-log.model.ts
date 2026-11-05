import {
  DataTypes,
  Model,
  type CreationOptional,
  type ForeignKey,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';
import { User } from './user.model.js';

export class AuditLog extends Model<InferAttributes<AuditLog>, InferCreationAttributes<AuditLog>> {
  declare id: CreationOptional<string>;
  declare operator_id: ForeignKey<User['id']>;
  declare action: string;
  declare resource_type: string;
  declare resource_id: string;
  declare before_json: Record<string, unknown> | null;
  declare after_json: Record<string, unknown> | null;
  declare reason: string | null;
  declare request_id: string | null;
  declare created_at: CreationOptional<Date>;
}

export function initAuditLogModel(sequelize: Sequelize) {
  AuditLog.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      operator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: User, key: 'id' },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
      },
      action: { type: DataTypes.STRING(64), allowNull: false },
      resource_type: { type: DataTypes.STRING(64), allowNull: false },
      resource_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      before_json: { type: DataTypes.JSON, allowNull: true },
      after_json: { type: DataTypes.JSON, allowNull: true },
      reason: { type: DataTypes.STRING(255), allowNull: true },
      request_id: { type: DataTypes.STRING(64), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'audit_logs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
    },
  );
  return AuditLog;
}
