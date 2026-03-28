import { Router } from 'express';
import { getMessagesController, replyMessageController, replyImageController } from '@server/controllers/messages.controller';
import { upload, multerErrorHandler } from '@server/middlewares/upload';

const router = Router();

router.get('/', getMessagesController);
router.post('/reply', replyMessageController);
router.post('/reply-image', upload.single('image'), multerErrorHandler, replyImageController);

export const messagesRoutes = router;
