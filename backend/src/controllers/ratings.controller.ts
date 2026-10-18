import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validate, authenticateJWT, optionalAuthenticateJWT } from '../middlewares';
import * as ratingsService from '../services/ratings.service';

const userIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Usuario inválido') }),
});

const upsertRatingSchema = z.object({
  params: z.object({ id: z.string().uuid('Usuario inválido') }),
  body: z.object({
    score: z
      .number()
      .int()
      .min(ratingsService.MIN_SCORE)
      .max(ratingsService.MAX_SCORE, `La puntuación debe estar entre 1 y 5`),
    comment: z.string().max(1000).nullish(),
  }),
});

const list = [
  optionalAuthenticateJWT,
  validate(userIdParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await ratingsService.listForUser(req.params.id, req.user?.id);
      res.status(200).json({ status: 'success', ...result });
    } catch (err) {
      next(err);
    }
  },
];

const upsert = [
  authenticateJWT,
  validate(upsertRatingSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await ratingsService.createOrUpdateRating(
        req.user!.id,
        req.params.id,
        req.body.score,
        req.body.comment ?? null
      );
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },
];

export default { list, upsert };
