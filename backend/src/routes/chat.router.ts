import { Router } from 'express';
import chatController from '../controllers/chat.controller';

const router = Router();

router.get('/conversations', chatController.listConversations);
router.get('/:applicationId/messages', chatController.listMessages);
router.post('/:applicationId/messages', chatController.sendMessage);
router.post('/:applicationId/receipts', chatController.updateReceipts);

export default router;