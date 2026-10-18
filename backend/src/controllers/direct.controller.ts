import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { validate, authenticateJWT } from '../middlewares';
import * as directService from '../services/direct.service';

const startConversationSchema = z.object({
  body: z.object({ userId: z.string().uuid('Usuario inválido') }),
});

const conversationParamsSchema = z.object({
  params: z.object({ conversationId: z.string().uuid('Conversación inválida') }),
});

const sendMessageSchema = z.object({
  params: z.object({ conversationId: z.string().uuid('Conversación inválida') }),
  body: z.object({ content: z.string().min(1, 'El mensaje no puede estar vacío') }),
});

const list = [
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await directService.listConversations(req.user!.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },
];

const start = [
  authenticateJWT,
  validate(startConversationSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await directService.startOrGetConversation(req.user!.id, req.body.userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },
];

const listMessages = [
  authenticateJWT,
  validate(conversationParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await directService.listMessages(req.params.conversationId, req.user!.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },
];

const sendMessage = [
  authenticateJWT,
  validate(sendMessageSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await directService.sendMessage(
        req.params.conversationId,
        req.user!.id,
        req.body.content
      );
      res.status(201).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },
];

export default { list, start, listMessages, sendMessage };
