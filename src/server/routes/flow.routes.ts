import { Router } from 'express';
import { getFlowController, saveFlowController, resetFlowController } from '@server/controllers/flow.controller';

const router = Router();

router.get('/', getFlowController);
router.put('/', saveFlowController);
router.post('/reset', resetFlowController);

export const flowRoutes = router;
