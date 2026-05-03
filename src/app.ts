import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';

export function buildApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  app.use(errorHandler);
  return app;
}
