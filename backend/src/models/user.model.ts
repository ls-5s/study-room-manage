import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export type UserRole = 'student' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'disabled';

export function isAdminRole(role: UserRole): role is 'admin' | 'super_admin' {
  return role === 'admin' || role === 'super_admin';
}

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare student_no: string;
  declare username: string;
  declare display_name: string;
  declare email: string | null;
  declare phone: string | null;
  declare avatar_url: string | null;
  declare password_hash: string;
  declare role: UserRole;
  declare status: UserStatus;
  declare violation_count: CreationOptional<number>;
  declare restriction_started_at: Date | null;
  declare restriction_until: Date | null;
  declare last_login_at: Date | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initUserModel(sequelize: Sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      student_no: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      username: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      display_name: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(128),
        allowNull: true,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      avatar_url: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      password_hash: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('student', 'admin', 'super_admin'),
        allowNull: false,
        defaultValue: 'student',
      },
      status: {
        type: DataTypes.ENUM('active', 'disabled'),
        allowNull: false,
        defaultValue: 'active',
      },
      violation_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      restriction_started_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      restriction_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return User;
}
