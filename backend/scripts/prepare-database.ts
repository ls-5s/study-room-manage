import { randomBytes } from 'node:crypto';
import { readFile, writeFile, open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'dotenv';
import { createConnection } from 'mysql2/promise';
import { verifyApplication } from './application-verification.js';
import { executeAdministratorQuery } from './admin-mysql.js';
import {
  insertGeneratedPassword,
  PreparationError,
  prepareDatabase,
  readPreparationConfig,
} from './database-preparation.js';

const backendDirectory = fileURLToPath(new URL('../', import.meta.url));
const environmentPath = resolve(backendDirectory, '.env');
const examplePath = resolve(backendDirectory, '.env.example');
const lockPath = resolve(backendDirectory, '.db-prepare.lock');

async function readEnvironment(): Promise<{ contents: string; exists: boolean }> {
  try {
    return { contents: await readFile(environmentPath, 'utf8'), exists: true };
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw new PreparationError('无法读取后端本地环境文件。');
    }
    try {
      return { contents: await readFile(examplePath, 'utf8'), exists: false };
    } catch {
      throw new PreparationError('缺少后端 .env.example，无法准备数据库。');
    }
  }
}

export async function main(): Promise<void> {
  let lock: Awaited<ReturnType<typeof open>>;
  try {
    lock = await open(lockPath, 'wx', 0o600);
  } catch {
    throw new PreparationError('另一个数据库准备过程正在运行，或锁文件无法创建；请确认后再执行。');
  }

  try {
    const environment = await readEnvironment();
    const config = readPreparationConfig(parse(environment.contents));
    await prepareDatabase(config, {
      adminQuery: async (sql) => executeAdministratorQuery(config.containerName, sql),
      verifyApplication: (applicationConfig, withDatabase) =>
        verifyApplication(applicationConfig, withDatabase, createConnection),
      persistGeneratedPassword: async (password) => {
        await writeFile(environmentPath, insertGeneratedPassword(environment.contents, password), {
          encoding: 'utf8',
          mode: 0o600,
        });
      },
      generatePassword: () => randomBytes(32).toString('hex'),
      log: (message) => console.info(message),
    });
    if (!environment.exists && config.password) {
      await writeFile(environmentPath, environment.contents, { encoding: 'utf8', mode: 0o600 });
    }
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

const entrypoint = process.argv[1];
if (entrypoint && pathToFileURL(resolve(entrypoint)).href === import.meta.url) {
  main().catch((error: unknown) => {
    console.error(
      error instanceof PreparationError ? error.message : '数据库准备失败；未输出敏感错误内容。',
    );
    process.exitCode = 1;
  });
}
