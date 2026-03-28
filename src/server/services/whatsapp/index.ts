// ── Punto de entrada del módulo WhatsApp ──────────────────────────────────
export { setAwaitingConfirmation, DEFAULT_INSTANCE_ID } from './state';
export { sendWhatsAppMessage, sendWhatsAppImage, sendWhatsAppButtons, reply } from './sender';
export { instanceManager } from './instanceManager';

// ── Mensajes del Bot ──────────────────────────────────────────────────────
export {
  ERROR_MESSAGES,
  VALIDATION_MESSAGES,
  OPERATOR_HELP_MESSAGES,
  AUTH_MESSAGES,
  REGISTRATION_MESSAGES,
  COMMAND_MESSAGES,
  WAIT_MESSAGES,
  APPOINTMENT_MESSAGES,
  REJECTION_MESSAGES,
  ADMIN_MESSAGES,
} from './messages';
