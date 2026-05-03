import { RequestHandler } from 'express';
import * as service from './auth.service';
import type { LoginInput } from './auth.schema';

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = await service.login(req.body as LoginInput);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
