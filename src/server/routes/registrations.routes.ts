import { Router } from 'express';
import { upload } from '@server/middlewares/upload';
import {
  getRegistrationsController,
  rejectRegistrationController,
  claimRegistrationController,
  releaseRegistrationController,
  approveRegistrationController,
  denyRegistrationController,
} from '@server/controllers/registrations.controller';

const router = Router();

router.get('/', getRegistrationsController);
router.post('/reject', upload.single('image'), rejectRegistrationController);
router.post('/claim', claimRegistrationController);
router.post('/release', releaseRegistrationController);
router.post('/approve', upload.single('image'), approveRegistrationController);
router.post('/deny', denyRegistrationController);

export const registrationsRoutes = router;
