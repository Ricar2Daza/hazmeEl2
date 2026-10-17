import { Router } from 'express';
import applicationsController from '../controllers/applications.controller';

const router = Router();

router.get('/mine', applicationsController.listMine);
router.patch('/:id/accept', applicationsController.accept);
router.patch('/:id/reject', applicationsController.reject);

export default router;
