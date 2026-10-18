import { Router } from 'express';
import usersController from '../controllers/users.controller';

const router = Router();

router.get('/', usersController.search);
router.get('/:id', usersController.getById);

export default router;
