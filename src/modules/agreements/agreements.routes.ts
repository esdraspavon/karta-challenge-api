import { Router } from 'express';
import { authJwt } from '../../middlewares/authJwt';
import { validate } from '../../middlewares/validate';
import { agreementIdParam } from './agreements.schema';
import * as controller from './agreements.controller';

const router = Router();

router.get('/me/pending-agreements', authJwt, controller.getPending);
router.get('/me/signed-agreements', authJwt, controller.getSigned);
router.post(
  '/agreements/:agreementId/sign',
  authJwt,
  validate(agreementIdParam, 'params'),
  controller.sign,
);

export default router;
