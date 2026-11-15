import { randomBytes } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Op, type Transaction } from 'sequelize';
import { createDatabase } from '../src/config/database.js';
import { ConfigurationError, loadDatabaseConfig } from '../src/config/env.js';
import {
  assertValidStudentNo,
  assertValidUsername,
  normalizeDisplayName,
  normalizeStudentNo,
  normalizeUsername,
} from '../src/lib/auth-normalization.js';
import { assertValidPassword, hashPassword } from '../src/lib/password.js';
import { createAuthenticationModels } from '../src/models/index.js';
import { createFeedbackModels } from '../src/models/feedback-models.js';
import { createStudyRoomModels } from '../src/models/study-room-models.js';
import type { FeedbackStatus, FeedbackType } from '../src/models/feedback-ticket.model.js';
import { isAdminRole } from '../src/models/user.model.js';

const username = normalizeUsername(process.env.DEMO_STUDENT_USERNAME?.trim() || 'feedback_demo');
const studentNo = normalizeStudentNo(process.env.DEMO_STUDENT_STUDENT_NO?.trim() || 'DEMO26001');
const displayName = normalizeDisplayName(
  process.env.DEMO_STUDENT_DISPLAY_NAME?.trim() || '演示同学',
);
const adminUsername = normalizeUsername(
  process.env.DEMO_ADMIN_USERNAME?.trim() || 'feedback_admin',
);
const adminStudentNo = normalizeStudentNo(
  process.env.DEMO_ADMIN_STUDENT_NO?.trim() || 'DEMOADMIN01',
);
const adminDisplayName = normalizeDisplayName(
  process.env.DEMO_ADMIN_DISPLAY_NAME?.trim() || '反馈演示管理员',
);

interface DemoAudit {
  from: FeedbackStatus;
  to: FeedbackStatus;
  at: Date;
}

interface DemoTicket {
  type: FeedbackType;
  description: string;
  status: FeedbackStatus;
  createdAt: Date;
  processedAt: Date | null;
  closedAt: Date | null;
  result: string | null;
  audits: DemoAudit[];
}

function hoursAgo(now: Date, hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60_000);
}

function buildDemoTickets(now: Date): DemoTicket[] {
  const processingAt = hoursAgo(now, 2);
  const resolvedProcessingAt = hoursAgo(now, 23);
  const resolvedAt = hoursAgo(now, 22);
  const rejectedAt = hoursAgo(now, 47);

  return [
    {
      type: 'occupied_seat',
      description: 'A-03 座位从上午开始一直放着书本和水杯，现场无人使用，希望管理员协助核实。',
      status: 'pending',
      createdAt: hoursAgo(now, 0.5),
      processedAt: null,
      closedAt: null,
      result: null,
      audits: [],
    },
    {
      type: 'equipment',
      description: '靠窗第二排的台灯无法打开，插座也没有电，晚自习时影响使用。',
      status: 'processing',
      createdAt: hoursAgo(now, 3),
      processedAt: processingAt,
      closedAt: null,
      result: null,
      audits: [{ from: 'pending', to: 'processing', at: processingAt }],
    },
    {
      type: 'environment',
      description: '中午时段空调温度偏低，靠北侧座位体感较冷，希望能调整或提示同学添衣。',
      status: 'resolved',
      createdAt: hoursAgo(now, 24),
      processedAt: resolvedProcessingAt,
      closedAt: resolvedAt,
      result: '已联系物业检查空调设置，并将北侧区域温度调整到适宜范围。',
      audits: [
        { from: 'pending', to: 'processing', at: resolvedProcessingAt },
        { from: 'processing', to: 'resolved', at: resolvedAt },
      ],
    },
    {
      type: 'other',
      description: '希望入口处能够增加临时雨伞存放点，下雨天带入自习室的水渍较多。',
      status: 'rejected',
      createdAt: hoursAgo(now, 48),
      processedAt: null,
      closedAt: rejectedAt,
      result: '当前场地条件暂不支持设置固定雨伞架，已记录建议并在后续空间调整时评估。',
      audits: [{ from: 'pending', to: 'rejected', at: rejectedAt }],
    },
  ];
}

async function demoPassword(
  envKey: 'DEMO_STUDENT_PASSWORD' | 'DEMO_ADMIN_PASSWORD',
  prefix: string,
): Promise<{ value: string; generated: boolean }> {
  const configured = process.env[envKey];
  if (configured) {
    assertValidPassword(configured);
    return { value: configured, generated: false };
  }

  const generated = `${prefix}${randomBytes(18).toString('base64url')}`;
  assertValidPassword(generated);
  const envPath = resolve(process.cwd(), '.env');
  const current = await readFile(envPath, 'utf8');
  if (!new RegExp(`^${envKey}=`, 'm').test(current)) {
    const separator = current.endsWith('\n') ? '' : '\n';
    await appendFile(
      envPath,
      `${separator}\n# 本地反馈模块演示账号密码，后端 .env 不提交到 Git。\n${envKey}=${generated}\n`,
      'utf8',
    );
  }
  return { value: generated, generated: true };
}

async function createAuditLogs(
  models: ReturnType<typeof createFeedbackModels>,
  ticketId: string,
  ticketType: FeedbackType,
  adminId: string,
  audits: readonly DemoAudit[],
  transaction: Transaction,
) {
  for (const audit of audits) {
    await models.AuditLog.create(
      {
        operator_id: adminId,
        action: `feedback_ticket.${audit.to}`,
        resource_type: 'feedback_ticket',
        resource_id: ticketId,
        before_json: { status: audit.from, type: ticketType },
        after_json: { status: audit.to, type: ticketType },
        reason: null,
        request_id: null,
        created_at: audit.at,
      },
      { transaction },
    );
  }
}

async function main() {
  assertValidUsername(username);
  assertValidStudentNo(studentNo);
  assertValidUsername(adminUsername);
  assertValidStudentNo(adminStudentNo);

  const database = createDatabase(loadDatabaseConfig());
  try {
    const authModels = createAuthenticationModels(database.sequelize);
    const roomModels = createStudyRoomModels(database.sequelize, authModels);
    const models = createFeedbackModels(database.sequelize, {
      User: authModels.User,
      StudyRoom: roomModels.StudyRoom,
      Seat: roomModels.Seat,
      AuditLog: authModels.AuditLog,
    });

    let admin = await authModels.User.findOne({
      where: { username: adminUsername },
    });
    if (admin) {
      if (!isAdminRole(admin.role)) {
        throw new Error('演示管理员用户名已被学生账号占用。');
      }
    } else {
      const password = await demoPassword('DEMO_ADMIN_PASSWORD', 'FbAdmin-');
      admin = await authModels.User.create({
        username: adminUsername,
        student_no: adminStudentNo,
        display_name: adminDisplayName,
        email: null,
        phone: null,
        avatar_url: null,
        password_hash: await hashPassword(password.value, Number(process.env.BCRYPT_COST ?? '12')),
        role: 'super_admin',
        status: 'active',
        violation_count: 0,
        restriction_started_at: null,
        restriction_until: null,
        last_login_at: null,
      });
    }

    let student = await authModels.User.findOne({
      where: { [Op.or]: [{ username }, { student_no: studentNo }] },
    });
    let generatedPassword = false;
    if (student) {
      if (student.role !== 'student' || student.username !== username) {
        throw new Error('演示学生用户名或学号已被其他账号占用。');
      }
    } else {
      const password = await demoPassword('DEMO_STUDENT_PASSWORD', 'FbDemo-');
      generatedPassword = password.generated;
      student = await authModels.User.create({
        username,
        student_no: studentNo,
        display_name: displayName,
        email: null,
        phone: null,
        avatar_url: null,
        password_hash: await hashPassword(password.value, Number(process.env.BCRYPT_COST ?? '12')),
        role: 'student',
        status: 'active',
        violation_count: 0,
        restriction_started_at: null,
        restriction_until: null,
        last_login_at: null,
      });
    }

    const room =
      (await roomModels.StudyRoom.findOne({
        where: { status: 'open' },
        order: [
          ['name', 'ASC'],
          ['id', 'ASC'],
        ],
      })) ?? null;
    if (!room) throw new Error('未找到开放自习室，请先执行 pnpm db:seed:rooms。');
    const seat = await roomModels.Seat.findOne({
      where: { room_id: room.id, status: 'available' },
      order: [['seat_no', 'ASC']],
    });
    if (!seat) throw new Error('未找到可用座位，无法生成占座举报演示数据。');

    const existing = await models.FeedbackTicket.count({
      where: {
        user_id: student.id,
        description: { [Op.like]: '%座位从上午开始一直放着%' },
      },
    });

    let created = 0;
    if (existing === 0) {
      const now = new Date();
      await database.sequelize.transaction(async (transaction) => {
        for (const demo of buildDemoTickets(now)) {
          const ticket = await models.FeedbackTicket.create(
            {
              user_id: String(student.id),
              room_id: String(room.id),
              seat_id: demo.type === 'occupied_seat' ? String(seat.id) : null,
              room_name_snapshot: room.name,
              seat_no_snapshot: demo.type === 'occupied_seat' ? seat.seat_no : null,
              type: demo.type,
              description: demo.description,
              status: demo.status,
              result: demo.result,
              handled_by: demo.status === 'pending' ? null : String(admin.id),
              processed_at: demo.processedAt,
              closed_at: demo.closedAt,
              created_at: demo.createdAt,
              updated_at: demo.closedAt ?? demo.processedAt ?? demo.createdAt,
            },
            { transaction },
          );
          await createAuditLogs(
            models,
            String(ticket.id),
            demo.type,
            String(admin.id),
            demo.audits,
            transaction,
          );
          created += 1;
        }
      });
    }

    console.info(
      [
        `反馈演示学生：${username}`,
        `反馈演示管理员：${adminUsername}`,
        generatedPassword ? '演示密码已写入 backend/.env 的 DEMO_STUDENT_PASSWORD' : '',
        created > 0 ? `已创建 ${created} 条反馈工单` : '反馈演示工单已存在，未重复创建',
      ]
        .filter(Boolean)
        .join('；'),
    );
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof ConfigurationError
      ? `配置无效：${error.message}`
      : '反馈演示数据初始化失败，请检查迁移、管理员和自习室数据。',
  );
  if (error instanceof Error && !(error instanceof ConfigurationError)) {
    console.error(error.message);
  }
  process.exitCode = 1;
});
