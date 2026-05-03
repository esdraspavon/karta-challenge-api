import type { Knex } from 'knex';
import bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  await knex('users').del();
  const password_hash = await bcrypt.hash('Password1!', 10);
  await knex('users').insert([
    { id: 1, email: 'alice@karta.test', password_hash, card_program_id: 1 },
    { id: 2, email: 'bob@karta.test', password_hash, card_program_id: 2 },
  ]);
}
