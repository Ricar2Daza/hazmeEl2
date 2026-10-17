import { Router } from 'express';
import authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.get('/verify/:token', authController.verify);
router.get('/me', authController.me);
router.put('/profile', authController.updateProfile);

export default router;
