import { RequestHandler } from 'express';
import * as service from './admin.service';
import type { PublishAgreementInput } from './admin.schema';

export const publishAgreement: RequestHandler = async (req, res, next) => {
  try {
    const created = await service.publishAgreement(req.body as PublishAgreementInput);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};
