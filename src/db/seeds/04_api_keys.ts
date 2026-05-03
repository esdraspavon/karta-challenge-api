import type { Knex } from 'knex';
import { sha256 } from '../../utils/hash';

export async function seed(knex: Knex): Promise<void> {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || adminKey.length < 8) {
    throw new Error(
      'ADMIN_API_KEY is missing or too short in .env — refuse to seed without a real admin key.',
    );
  }

  await knex('api_keys').del();
  await knex('api_keys').insert({
    name: 'default-admin',
    key_hash: sha256(adminKey),
  });

  console.log('');
  console.log('================ Karta seed completed ================');
  console.log(' Test users:');
  console.log('   alice@karta.test / Password1!  (MASTERCARD_KARTA_METAL)');
  console.log('   bob@karta.test   / Password1!  (VISA_KARTA_METAL)');
  console.log('');
  console.log(" API key 'default-admin' registered (sha256 of ADMIN_API_KEY from .env).");
  console.log('======================================================');
  console.log('');
}
