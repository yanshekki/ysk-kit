import { Router } from 'express';
import type { createUserService } from '../application/user-service';

export const createUserRouter = (service: ReturnType<typeof createUserService>) => {
  const router = Router();
  router.get('/v1/users', async (_req, res, next) => {
    try {
      res.json({ ok: true, data: await service.list() });
    } catch (error) {
      next(error);
    }
  });
  router.post('/v1/users', async (req, res, next) => {
    try {
      res.status(201).json({ ok: true, data: await service.create(req.body) });
    } catch (error) {
      next(error);
    }
  });
  return router;
};
