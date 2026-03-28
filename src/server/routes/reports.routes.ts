import { Router } from 'express';
import { getReportsController } from '@server/controllers/reports.controller';

const router = Router();

router.get('/', getReportsController);

export const reportsRoutes = router;
