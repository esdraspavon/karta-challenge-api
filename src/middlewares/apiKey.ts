import { RequestHandler } from 'express';
import { db } from '../config/db';
import { Unauthorized } from '../utils/errors';
import { sha256 } from '../utils/hash';

interface ApiKeyRow {
  id: number;
  name: string;
}

export const apiKeyAuth: RequestHandler = async (req, _res, next) => {
  try {
    const raw = req.header('x-api-key');
    if (!raw) {
      throw Unauthorized('Missing X-API-Key header');
    }
    const hash = sha256(raw);
    const row = await db<ApiKeyRow>('api_keys').where({ key_hash: hash }).first();
    if (!row) {
      throw Unauthorized('Invalid API key');
    }
    req.apiKey = { id: row.id, name: row.name };
    next();
  } catch (err) {
    next(err);
  }
};
