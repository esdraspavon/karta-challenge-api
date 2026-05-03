import { RequestHandler } from 'express';
import * as service from './users.service';
import { Unauthorized } from '../../utils/errors';

export const getMe: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    const me = await service.getMe(req.user.id);
    res.status(200).json(me);
  } catch (err) {
    next(err);
  }
};
