import { Router } from 'express';
import { apiKeyAuth } from '../../middlewares/apiKey';
import { validate } from '../../middlewares/validate';
import { publishAgreementSchema } from './admin.schema';
import * as controller from './admin.controller';

const router = Router();

router.post(
  '/admin/agreements',
  apiKeyAuth,
  validate(publishAgreementSchema),
  controller.publishAgreement,
);

export default router;
