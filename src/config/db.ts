import knex, { Knex } from 'knex';
import knexConfig from '../../knexfile';
import { env } from './env';

const config = knexConfig[env.NODE_ENV];
if (!config) {
  throw new Error(`No knex config for NODE_ENV="${env.NODE_ENV}"`);
}

export const db: Knex = knex(config);
