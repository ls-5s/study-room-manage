import { QueryTypes } from 'sequelize';
import { createDatabase } from '../src/config/database.js';
import { loadDatabaseConfig } from '../src/config/env.js';
import { createAuthenticationModels } from '../src/models/index.js';

// A narrow, idempotent repair for the two fixtures identified in the 2026-11-19 report.
// Preserve original audits; each correction records its original and new values.
async function main() {
  const database = createDatabase(loadDatabaseConfig());
  const { User, AuditLog } = createAuthenticationModels(database.sequelize);
  try {
    let corrected = 0;
    await database.sequelize.transaction(async (transaction) => {
      const admin = await User.findOne({
        where: { role: 'super_admin', status: 'active' },
        order: [['id', 'ASC']],
        transaction,
      });
      if (!admin) throw new Error('需要有效的超级管理员作为演示数据修复审计人');
      const select = async (sql: string) =>
        database.sequelize.query<Record<string, unknown>>(sql, {
          type: QueryTypes.SELECT,
          transaction,
        });
      const audit = async (
        type: string,
        id: string,
        before: Record<string, unknown>,
        after: Record<string, unknown>,
        reason: string,
      ) => {
        await AuditLog.create(
          {
            operator_id: admin.id,
            action: 'demo_data.corrected',
            resource_type: type,
            resource_id: id,
            before_json: before,
            after_json: after,
            reason,
            request_id: 'repair-demo-data-20261119',
            created_at: new Date(),
          },
          { transaction },
        );
        corrected += 1;
      };
      const [violation] = await select(`SELECT * FROM violations WHERE id=3 AND reservation_id=15
        AND status='revoked' AND resolved_at < occurred_at FOR UPDATE`);
      if (violation) {
        const repairedAt = new Date();
        const reason =
          '历史演示数据校正：撤销时间改为本次校正时间，原值保留于修复审计，不代表原始撤销时刻';
        const resolutionReason = `${String(violation.resolution_reason ?? '')}；${reason}`;
        await database.sequelize.query(
          `UPDATE violations SET resolved_at=:at, updated_at=:at,
          resolution_reason=:reason WHERE id=3`,
          { replacements: { at: repairedAt, reason: resolutionReason }, transaction },
        );
        await audit(
          'violation',
          '3',
          violation,
          { resolved_at: repairedAt.toISOString(), resolution_reason: resolutionReason },
          reason,
        );
      }
      const [ticket] = await select(`SELECT * FROM feedback_tickets WHERE id=1
        AND type='occupied_seat' AND seat_no_snapshot='A-01'
        AND description='A-03 座位从上午开始一直放着书本和水杯，现场无人使用，希望管理员协助核实。' FOR UPDATE`);
      if (ticket) {
        const description = `${String(ticket.seat_no_snapshot)} 座位从上午开始一直放着书本和水杯，现场无人使用，希望管理员协助核实。`;
        await database.sequelize.query(
          'UPDATE feedback_tickets SET description=:description, updated_at=:at WHERE id=1',
          { replacements: { description, at: new Date() }, transaction },
        );
        await audit(
          'feedback_ticket',
          '1',
          ticket,
          { description },
          '按工单实际关联座位快照修复种子描述',
        );
      }
    });
    console.info(`演示数据校正完成：${corrected} 条，原值已保留在审计中。`);
  } finally {
    await database.close();
  }
}

main().catch(() => {
  console.error('演示数据校正失败，事务已回滚。');
  process.exitCode = 1;
});
