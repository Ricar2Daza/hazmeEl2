import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { authenticateJWT, validate } from '../middlewares';
import * as chatService from '../services/chat.service';

const applicationParamsSchema = z.object({
  params: z.object({ applicationId: z.string().uuid() }),
});

const sendMessageSchema = z.object({
  params: z.object({ applicationId: z.string().uuid() }),
  body: z.object({
    content: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(2000, 'El mensaje no puede superar 2000 caracteres'),
  }),
});

const receiptsSchema = z.object({
  params: z.object({ applicationId: z.string().uuid() }),
  body: z.object({ state: z.enum(['delivered', 'read']) }),
});

const listConversations = [
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversations = await chatService.listConversations(req.user!.id);
      res.status(200).json({ status: 'success', data: conversations });
    } catch (err) {
      next(err);
    }
  },
];

const listMessages = [
  authenticateJWT,
  validate(applicationParamsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messages = await chatService.listMessages(req.params.applicationId, req.user!.id);
      res.status(200).json({ status: 'success', data: messages });
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
      const message = await chatService.sendMessage(
        req.params.applicationId,
        req.user!.id,
        req.body.content
      );
      res.status(201).json({ status: 'success', data: message });
    } catch (err) {
      next(err);
    }
  },
];

/** Confirma entrega (delivered) o lectura (read) de los mensajes recibidos. */
const updateReceipts = [
  authenticateJWT,
  validate(receiptsSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await chatService.updateReceipts(
        req.params.applicationId,
        req.user!.id,
        req.body.state
      );
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  },
];

export default { listConversations, listMessages, sendMessage, updateReceipts };