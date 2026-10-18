import { Router } from 'express';
import directController from '../controllers/direct.controller';

const router = Router();

router.get('/conversations', directController.list);
router.post('/conversations', directController.start);
router.get('/conversations/:conversationId/messages', directController.listMessages);
router.post('/conversations/:conversationId/messages', directController.sendMessage);

export default router;
