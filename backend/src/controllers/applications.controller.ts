import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validate, authenticateJWT } from '../middlewares';
import * as applicationsService from '../services/applications.service';

const applySchema = z.object({
  params: z.object({ jobId: z.string().uuid() }),
  body: z.object({
    message: z.string().max(2000).optional().nullable(),
  }),
});

const jobIdSchema = z.object({
  params: z.object({ jobId: z.string().uuid() }),
});

const applicationIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const applyToJob = [
  authenticateJWT,
  validate(applySchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await applicationsService.applyToJob(
        req.params.jobId,
        req.user!.id,
        req.body?.message
      );
      res.status(201).json({
        status: 'success',
        message: 'Postulación enviada exitosamente',
        data: application,
      });
    } catch (err) {
      next(err);
    }
  },
];

const listMine = [
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applications = await applicationsService.listMine(req.user!.id);
      res.status(200).json({
        status: 'success',
        data: applications,
      });
    } catch (err) {
      next(err);
    }
  },
];

const listJobApplications = [
  authenticateJWT,
  validate(jobIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const applications = await applicationsService.listJobApplications(
        req.params.jobId,
        req.user!.id
      );
      res.status(200).json({
        status: 'success',
        data: applications,
      });
    } catch (err) {
      next(err);
    }
  },
];

const accept = [
  authenticateJWT,
  validate(applicationIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await applicationsService.acceptApplication(req.params.id, req.user!.id);
      res.status(200).json({
        status: 'success',
        message: 'Postulación aceptada',
        data: application,
      });
    } catch (err) {
      next(err);
    }
  },
];

const reject = [
  authenticateJWT,
  validate(applicationIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const application = await applicationsService.rejectApplication(req.params.id, req.user!.id);
      res.status(200).json({
        status: 'success',
        message: 'Postulación rechazada',
        data: application,
      });
    } catch (err) {
      next(err);
    }
  },
];

export default {
  applyToJob,
  listMine,
  listJobApplications,
  accept,
  reject,
};
