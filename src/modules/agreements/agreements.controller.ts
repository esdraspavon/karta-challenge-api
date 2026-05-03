import { RequestHandler } from 'express';
import * as service from './agreements.service';
import { Unauthorized } from '../../utils/errors';
import type { AgreementIdParam } from './agreements.schema';

export const getPending: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    const list = await service.getPendingForUser(req.user.id);
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
};

export const sign: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    const { agreementId } = req.params as unknown as AgreementIdParam;
    const signature = await service.signAgreement(req.user.id, agreementId);
    res.status(200).json(signature);
  } catch (err) {
    next(err);
  }
};

export const getSigned: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw Unauthorized();
    const list = await service.getSignedForUser(req.user.id);
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
};
