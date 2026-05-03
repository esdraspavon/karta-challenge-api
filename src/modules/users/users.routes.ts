import { Router } from 'express';
import { authJwt } from '../../middlewares/authJwt';
import * as controller from './users.controller';

const router = Router();

router.get('/me', authJwt, controller.getMe);

export default router;
