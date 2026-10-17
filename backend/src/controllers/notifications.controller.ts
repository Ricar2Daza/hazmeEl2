import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validate, authenticateJWT } from '../middlewares';
import * as notificationsService from '../services/notifications.service';

const notificationIdSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const listSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const list = [
  authenticateJWT,
  validate(listSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationsService.listNotifications(req.user!.id, req.query as any);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  },
];

const markRead = [
  authenticateJWT,
  validate(notificationIdSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notification = await notificationsService.markAsRead(req.params.id, req.user!.id);
      res.status(200).json({
        status: 'success',
        message: 'Notificación marcada como leída',
        data: notification,
      });
    } catch (err) {
      next(err);
    }
  },
];

const markAllRead = [
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationsService.markAllAsRead(req.user!.id);
      res.status(200).json({
        status: 'success',
        message: `${result.count} notificaciones marcadas como leídas`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
];

const unreadCount = [
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await notificationsService.getUnreadCount(req.user!.id);
      res.status(200).json({
        status: 'success',
        count,
      });
    } catch (err) {
      next(err);
    }
  },
];

export default {
  list,
  markRead,
  markAllRead,
  unreadCount,
};
