import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validate, optionalAuthenticateJWT } from '../middlewares';
import * as usersService from '../services/users.service';

const searchUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const userIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid('Usuario inválido') }),
});

const search = [
  optionalAuthenticateJWT,
  validate(searchUsersSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await usersService.searchUsers({
        ...(req.query as any),
      } as any, req.user?.id);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
];

const getById = [
  optionalAuthenticateJWT,
  validate(userIdParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await usersService.getPublicProfile(req.params.id);
      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  },
];

export default {
  search,
  getById,
};
