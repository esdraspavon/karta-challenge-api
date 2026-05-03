import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import agreementsRoutes from './modules/agreements/agreements.routes';

export function buildApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.use('/auth', authRoutes);
  app.use(usersRoutes);
  app.use(agreementsRoutes);

  app.use(errorHandler);
  return app;
}
