import { Router } from 'express';
import { validate } from '../../middlewares/validate';
import { loginSchema } from './auth.schema';
import * as controller from './auth.controller';

const router = Router();

router.post('/login', validate(loginSchema), controller.login);

export default router;
