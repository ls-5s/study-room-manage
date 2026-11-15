import type { Connection as MysqlConnection } from 'mysql2';
import { Sequelize } from 'sequelize';
import type { DatabaseConfig } from './env.js';

export interface Database {
  sequelize: Sequelize;
  probe: () => Promise<void>;
  close: () => Promise<void>;
}

export function createDatabase(config: DatabaseConfig): Database {
  const sequelize = new Sequelize(config.name, config.user, config.password, {
    dialect: 'mysql',
    host: config.host,
    port: config.port,
    logging: false,
    timezone: '+00:00',
    dialectOptions: { connectTimeout: config.connectTimeoutMs },
    pool: { max: 5, min: 0, acquire: config.acquireTimeoutMs, idle: 10_000 },
  });
  let inFlight: Promise<void> | undefined;

  // The probe owns its entire time budget: the deadline covers acquiring a connection and
  // running the query, and a timed-out query destroys its socket so the pool slot is freed.
  async function checkConnection(): Promise<void> {
    const manager = sequelize.connectionManager;
    const pooledConnection = await manager.getConnection({ type: 'write', useMaster: true });
    // This database factory fixes the dialect to mysql, so the pooled connection is a mysql2 one.
    const connection = pooledConnection as MysqlConnection;
    let timedOut = false;

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          timedOut = true;
          // query() cannot be cancelled; destroying the socket is what actually frees the slot.
          connection.destroy();
          reject(new Error(`Database probe timed out after ${config.probeTimeoutMs}ms`));
        }, config.probeTimeoutMs);
        timer.unref();

        connection.query({ sql: 'SELECT 1 AS ready' }, (error) => {
          clearTimeout(timer);
          // A timed-out probe already destroyed its connection and rejected this promise.
          if (timedOut) return;
          if (error) reject(error);
          else resolve();
        });
      });
    } finally {
      if (timedOut) {
        // destroy() closed the socket; this step also removes the connection from the pool.
        await manager.destroyConnection(pooledConnection);
      } else {
        manager.releaseConnection(pooledConnection);
      }
    }
  }

  async function probe(): Promise<void> {
    // Concurrent probes share one in-flight database operation instead of queueing for pool slots.
    const pending = inFlight ?? checkConnection();
    inFlight = pending;
    try {
      await pending;
    } finally {
      if (inFlight === pending) inFlight = undefined;
    }
  }

  return { sequelize, probe, close: () => sequelize.close() };
}
