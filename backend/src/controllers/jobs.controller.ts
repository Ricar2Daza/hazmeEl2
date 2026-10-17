import { z } from 'zod';
import { JobStatus } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { validate, authenticateJWT, optionalAuthenticateJWT } from '../middlewares';
import * as jobsService from '../services/jobs.service';

const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
    description: z.string().min(20, 'Descripción debe tener al menos 20 caracteres'),
    locationAddress: z.string().min(5, 'Dirección requerida'),
    budgetMin: z.number().int().min(0),
    budgetMax: z.number().int().min(0),
    deadlineDate: z.coerce.date(),
    categoryId: z.string().uuid('Categoría inválida'),
  }),
});

const updateJobSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z
    .object({
      title: z.string().min(5).optional(),
      description: z.string().min(20).optional(),
      locationAddress: z.string().min(5).optional(),
      budgetMin: z.number().int().min(0).optional(),
      budgetMax: z.number().int().min(0).optional(),
      deadlineDate: z.coerce.date().optional(),
      categoryId: z.string().uuid().optional(),
      status: z.nativeEnum(JobStatus).optional(),
    })
    .partial(),
});

const jobIdParamsSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const listJobsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    budgetMin: z.string().optional(),
    budgetMax: z.string().optional(),
    deadlineFrom: z.string().optional(),
    deadlineTo: z.string().optional(),
    status: z.nativeEnum(JobStatus).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
  }),
});

const create = [
  authenticateJWT,
  validate(createJobSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await jobsService.createJob(req.user!.id, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Trabajo publicado exitosamente',
        data: job,
      });
    } catch (err) {
      next(err);
    }
  },
];

const update = [
  authenticateJWT,
  validate(updateJobSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await jobsService.updateJob(req.params.id, req.user!.id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Trabajo actualizado',
        data: job,
      });
    } catch (err) {
      next(err);
    }
  },
];

const remove = [
  authenticateJWT,
  validate(jobIdParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await jobsService.cancelJob(req.params.id, req.user!.id);
      res.status(200).json({
        status: 'success',
        message: 'Trabajo cancelado',
        data: job,
      });
    } catch (err) {
      next(err);
    }
  },
];

const mine = [
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs = await jobsService.getMyPublished(req.user!.id);
      res.status(200).json({
        status: 'success',
        data: jobs,
      });
    } catch (err) {
      next(err);
    }
  },
];

const list = [
  optionalAuthenticateJWT,
  validate(listJobsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await jobsService.listJobs(
        {
          ...req.query,
        } as any,
        req.user?.id
      );
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
  validate(jobIdParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const job = await jobsService.getJobById(req.params.id, req.user?.id);
      res.status(200).json({
        status: 'success',
        data: job,
      });
    } catch (err) {
      next(err);
    }
  },
];

export default {
  create,
  update,
  remove,
  mine,
  list,
  getById,
};
