import { Router } from 'express';
import {
  listInstancesController,
  createInstanceController,
  deleteInstanceController,
} from '@server/controllers/instances.controller';

const router = Router();

router.get('/', listInstancesController);
router.post('/', createInstanceController);
router.delete('/:id', deleteInstanceController);

export const instancesRoutes = router;
