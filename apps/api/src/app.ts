import cors from 'cors';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { createPrismaUserRepository } from './modules/identity/infra/prisma-user-repository';
import { createUserService } from './modules/identity/application/user-service';
import { createUserRouter } from './modules/identity/infra/user-router';
import { errorHandler } from './http/error-handler';

export const createApp = (prisma = new PrismaClient()) => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true, data: { status: 'ok' } }));
  const users = createUserService(createPrismaUserRepository(prisma));
  app.use(createUserRouter(users));
  app.use(errorHandler);
  return app;
};
