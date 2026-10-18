import { Router } from 'express';
import usersController from '../controllers/users.controller';
import ratingsController from '../controllers/ratings.controller';

const router = Router();

router.get('/', usersController.search);
router.get('/:id', usersController.getById);

// Valoraciones de un usuario (lista pública + crear/editar la propia).
router.get('/:id/ratings', ratingsController.list);
router.post('/:id/ratings', ratingsController.upsert);

export default router;
