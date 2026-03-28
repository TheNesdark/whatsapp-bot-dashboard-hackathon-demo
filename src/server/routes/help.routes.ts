import { Router } from 'express';
import {
  getHelpRequestsController,
  createHelpRequestController,
  resolveHelpRequestController,
  deleteHelpRequestController,
} from '@server/controllers/help.controller';

const router = Router();

router.get('/', getHelpRequestsController);
router.post('/', createHelpRequestController);
router.post('/:id/resolve', resolveHelpRequestController);
router.delete('/:id', deleteHelpRequestController);

export const helpRoutes = router;
