import {
  DataTypes,
  Model,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  type Sequelize,
} from 'sequelize';

export type StudyRoomStatus = 'open' | 'closed' | 'disabled';

export class StudyRoom extends Model<
  InferAttributes<StudyRoom>,
  InferCreationAttributes<StudyRoom>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare location: string;
  declare description: string | null;
  declare grid_rows: number;
  declare grid_columns: number;
  declare status: StudyRoomStatus;
  declare bookable_from: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

export function initStudyRoomModel(sequelize: Sequelize) {
  StudyRoom.init(
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING(64), allowNull: false },
      location: { type: DataTypes.STRING(128), allowNull: false },
      description: { type: DataTypes.STRING(500), allowNull: true },
      grid_rows: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      grid_columns: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      status: {
        type: DataTypes.ENUM('open', 'closed', 'disabled'),
        allowNull: false,
        defaultValue: 'closed',
      },
      bookable_from: { type: DataTypes.DATEONLY, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      tableName: 'study_rooms',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    },
  );
  return StudyRoom;
}
