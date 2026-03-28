import { Router } from 'express';
import { getSettingsController, saveSettingsController } from '@server/controllers/settings.controller';

const router = Router();

router.get('/', getSettingsController);
router.post('/', saveSettingsController);

export const settingsRoutes = router;
