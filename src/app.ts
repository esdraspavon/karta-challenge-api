import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import agreementsRoutes from './modules/agreements/agreements.routes';
import adminRoutes from './modules/admin/admin.routes';
import { buildOpenApiSpec } from './openapi/spec';

export function buildApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ ok: true });
  });

  const openApiDoc = buildOpenApiSpec();
  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiDoc);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

  app.use('/auth', authRoutes);
  app.use(usersRoutes);
  app.use(agreementsRoutes);
  app.use(adminRoutes);

  app.use(errorHandler);
  return app;
}
