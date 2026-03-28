import { Router, Request, Response } from 'express';
import { parseWebhookPayload } from '@server/services/whatsapp/businessApi';
import { handleIncomingWebhookMessages } from '@server/services/whatsapp/handler';
import { getWabaVerifyToken } from '@server/utils/sysConfig';

const router = Router();

/** Verificación del webhook por Meta (GET) */
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === getWabaVerifyToken()) {
    console.log('[Webhook] Verificado ✅');
    res.status(200).send(challenge as string);
    return;
  }

  res.sendStatus(403);
});

/** Mensajes entrantes de WhatsApp (POST) */
router.post('/', (req: Request, res: Response) => {
  const msgs = parseWebhookPayload(req.body);
  if (msgs.length) handleIncomingWebhookMessages(msgs).catch(console.error);
  res.sendStatus(200);
});

export const webhookRoutes = router;
