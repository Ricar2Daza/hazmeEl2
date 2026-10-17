import { Router } from 'express';
import notificationsController from '../controllers/notifications.controller';

const router = Router();

router.get('/', notificationsController.list);
router.patch('/read-all', notificationsController.markAllRead);
router.get('/unread-count', notificationsController.unreadCount);
router.patch('/:id/read', notificationsController.markRead);

export default router;
