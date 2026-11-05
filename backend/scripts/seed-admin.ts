import { Op } from 'sequelize';
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
import { isAdminRole } from '../src/models/user.model.js';

async function main() {
  const databaseConfig = loadDatabaseConfig();
  const username = normalizeUsername(process.env.ADMIN_USERNAME?.trim() || 'admin');
  const studentNo = normalizeStudentNo(process.env.ADMIN_STUDENT_NO?.trim() || 'ADMIN0001');
  const displayName = normalizeDisplayName(process.env.ADMIN_DISPLAY_NAME?.trim() || '系统管理员');
  const password = process.env.ADMIN_PASSWORD ?? '';
  const bcryptCost = Number(process.env.BCRYPT_COST ?? '12');

  assertValidUsername(username);
  assertValidStudentNo(studentNo);
  assertValidPassword(password);
  if (!Number.isInteger(bcryptCost) || bcryptCost < 12 || bcryptCost > 14) {
    throw new Error('BCRYPT_COST 必须是 12-14 的整数');
  }

  const database = createDatabase(databaseConfig);
  try {
    const models = createAuthenticationModels(database.sequelize);
    const existing = await models.User.findOne({
      where: { [Op.or]: [{ username }, { student_no: studentNo }] },
    });
    if (existing) {
      if (!isAdminRole(existing.role) || existing.username !== username) {
        throw new Error('管理员用户名或内部学号已被其他角色占用');
      }
      if (existing.role !== 'super_admin') {
        throw new Error('现有管理员尚未升级为超级管理员，请先执行数据库迁移');
      }
      console.info('管理员账号已存在；未覆盖现有密码。');
      return;
    }

    await models.User.create({
      username,
      student_no: studentNo,
      display_name: displayName,
      email: null,
      phone: null,
      avatar_url: null,
      password_hash: await hashPassword(password, bcryptCost),
      role: 'super_admin',
      status: 'active',
      violation_count: 0,
      restriction_started_at: null,
      restriction_until: null,
      last_login_at: null,
    });
    console.info(`管理员账号已创建：${username}`);
  } finally {
    await database.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    error instanceof ConfigurationError
      ? `配置无效：${error.message}`
      : '管理员初始化失败，请检查管理员环境变量和数据库连接。',
  );
  process.exitCode = 1;
});
