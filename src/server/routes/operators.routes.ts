import { Router } from 'express';
import {
  getOperatorsController,
  createOperatorController,
  deleteOperatorController,
} from '@server/controllers/operators.controller';

const router = Router();

router.get('/', getOperatorsController);
router.post('/', createOperatorController);
router.delete('/:id', deleteOperatorController);

export const operatorsRoutes = router;
