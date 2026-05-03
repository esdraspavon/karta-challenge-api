import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const EXPIRES_IN = '7d';

export interface UserTokenPayload {
  sub: number;
}

export function signUserToken(userId: number): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyUserToken(token: string): UserTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'number') {
    throw new Error('Invalid token payload');
  }
  return { sub: decoded.sub };
}
