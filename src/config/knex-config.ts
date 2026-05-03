import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

type BetterSqliteConnection = { pragma: (sql: string) => void };

const enableForeignKeys = (conn: BetterSqliteConnection, cb: () => void) => {
  conn.pragma('foreign_keys = ON');
  cb();
};

const projectRoot = path.resolve(__dirname, '..', '..');

const sharedClient: Knex.Config = {
  client: 'better-sqlite3',
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve(projectRoot, 'src/db/migrations'),
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: path.resolve(projectRoot, 'src/db/seeds'),
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
  pool: {
    afterCreate: enableForeignKeys,
  },
};

const config: Record<string, Knex.Config> = {
  development: {
    ...sharedClient,
    connection: { filename: process.env.DB_FILE ?? 'dev.sqlite' },
  },
  test: {
    ...sharedClient,
    connection: { filename: 'test.sqlite' },
  },
  production: {
    ...sharedClient,
    connection: { filename: process.env.DB_FILE ?? 'prod.sqlite' },
  },
};

export default config;
