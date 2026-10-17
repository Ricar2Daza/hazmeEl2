import { Router } from 'express';
import jobsController from '../controllers/jobs.controller';
import applicationsController from '../controllers/applications.controller';

const router = Router();

router.post('/', jobsController.create);
router.put('/:id', jobsController.update);
router.delete('/:id', jobsController.remove);
router.get('/mine', jobsController.mine);
router.get('/:id', jobsController.getById);
router.get('/', jobsController.list);

router.post('/:jobId/apply', applicationsController.applyToJob);
router.get('/:jobId/applications', applicationsController.listJobApplications);

export default router;
