import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('card_programs').del();
  await knex('card_programs').insert([
    { id: 1, code: 'MASTERCARD_KARTA_METAL', name: 'Mastercard Karta Metal' },
    { id: 2, code: 'VISA_KARTA_METAL', name: 'Visa Karta Metal' },
  ]);
}
