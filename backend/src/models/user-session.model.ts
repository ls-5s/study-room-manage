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

export class UserSession extends Model<
  InferAttributes<UserSession>,
  InferCreationAttributes<UserSession>
> {
  declare id: string;
  declare user_id: ForeignKey<User['id']>;
  declare jti: string;
  declare expires_at: Date;
  declare revoked_at: Date | null;
  declare created_at: CreationOptional<Date>;
}

export function initUserSessionModel(sequelize: Sequelize) {
  UserSession.init(
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: User, key: 'id' },
        onUpdate: 'RESTRICT',
        onDelete: 'RESTRICT',
      },
      jti: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        unique: true,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'user_sessions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
    },
  );
  return UserSession;
}
