import bcrypt from 'bcrypt';
import { db } from '../../config/db';
import { Unauthorized } from '../../utils/errors';
import { signUserToken } from '../../utils/jwt';
import type { LoginInput } from './auth.schema';

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  card_program_id: number;
}

interface CardProgramRow {
  id: number;
  code: string;
  name: string;
}

export async function login({ email, password }: LoginInput) {
  const user = await db<UserRow>('users').where({ email }).first();
  if (!user) {
    throw Unauthorized('Invalid credentials');
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    throw Unauthorized('Invalid credentials');
  }

  const program = await db<CardProgramRow>('card_programs').where({ id: user.card_program_id }).first();
  if (!program) {
    throw Unauthorized('User has no card program');
  }

  const token = signUserToken(user.id);
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      card_program: { code: program.code, name: program.name },
    },
  };
}
