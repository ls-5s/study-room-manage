import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export type FeedbackType = 'occupied_seat' | 'equipment' | 'environment' | 'other';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

export class FeedbackTicket extends Model<
  InferAttributes<FeedbackTicket>,
  InferCreationAttributes<FeedbackTicket>
> {
  declare id: CreationOptional<string>;
  declare user_id: string;
  declare room_id: string | null;
  declare seat_id: string | null;
  declare room_name_snapshot: string | null;
  declare seat_no_snapshot: string | null;
  declare type: FeedbackType;
  declare description: string;
  declare status: CreationOptional<FeedbackStatus>;
  declare result: string | null;
  declare handled_by: string | null;
  declare processed_at: Date | null;
  declare closed_at: Date | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initFeedbackTicketModel(sequelize: Sequelize) {
  FeedbackTicket.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      room_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      seat_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      room_name_snapshot: { type: DataTypes.STRING(64), allowNull: true },
      seat_no_snapshot: { type: DataTypes.STRING(32), allowNull: true },
      type: {
        type: DataTypes.ENUM('occupied_seat', 'equipment', 'environment', 'other'),
        allowNull: false,
      },
      description: { type: DataTypes.TEXT, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'resolved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      result: { type: DataTypes.TEXT, allowNull: true },
      handled_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
      processed_at: { type: DataTypes.DATE, allowNull: true },
      closed_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'feedback_tickets',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return FeedbackTicket;
}
