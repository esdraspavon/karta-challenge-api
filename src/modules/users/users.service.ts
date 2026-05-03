import { db } from '../../config/db';
import { NotFound } from '../../utils/errors';

interface MeRow {
  id: number;
  email: string;
  card_program_id: number;
  program_code: string;
  program_name: string;
}

export async function getMe(userId: number) {
  const row = await db<MeRow>('users')
    .join('card_programs', 'users.card_program_id', 'card_programs.id')
    .select(
      'users.id',
      'users.email',
      'users.card_program_id',
      'card_programs.code as program_code',
      'card_programs.name as program_name',
    )
    .where('users.id', userId)
    .first();

  if (!row) {
    throw NotFound('User not found');
  }

  return {
    id: row.id,
    email: row.email,
    card_program: {
      id: row.card_program_id,
      code: row.program_code,
      name: row.program_name,
    },
  };
}
