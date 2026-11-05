export type MigrationSqlExecutor = (sql: string) => Promise<void>;

export interface Migration {
  id: string;
  name: string;
  up: (execute: MigrationSqlExecutor) => Promise<void>;
  down: (execute: MigrationSqlExecutor) => Promise<void>;
}
