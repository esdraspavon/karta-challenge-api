import { db } from '../../src/config/db';
import { buildApp } from '../../src/app';
import { sha256 } from '../../src/utils/hash';

export const app = buildApp();
export { db, sha256 };

export const ADMIN_API_KEY = process.env.ADMIN_API_KEY ?? 'karta_admin_test_key_change_me';

async function cleanAll(): Promise<void> {
  // Delete in reverse FK order so foreign-key constraints are satisfied.
  await db('signatures').del();
  await db('api_keys').del();
  await db('agreements').del();
  await db('users').del();
  await db('card_programs').del();
}

export const mochaHooks = {
  async beforeAll() {
    await db.migrate.rollback({}, true);
    await db.migrate.latest();
  },
  async beforeEach() {
    await cleanAll();
    await db.seed.run();
  },
  async afterAll() {
    await db.destroy();
  },
};
