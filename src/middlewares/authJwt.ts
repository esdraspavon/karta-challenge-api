import { RequestHandler } from 'express';
import { Unauthorized } from '../utils/errors';
import { verifyUserToken } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
      apiKey?: { id: number; name: string };
    }
  }
}

export const authJwt: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    next(Unauthorized('Missing or malformed Authorization header'));
    return;
  }
  const token = header.slice(7).trim();
  try {
    const payload = verifyUserToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(Unauthorized('Invalid token'));
  }
};
