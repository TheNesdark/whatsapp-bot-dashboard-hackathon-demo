// ── Re-exportar tipos compartidos ──────────────────────────────────────────

export type {
  WhatsAppInstance,
  ParsedWebhookMessage,
  UserState,
  InstanceState,
  InstanceRow,
} from '@shared/whatsapp';

export interface CreateInstanceInput {
  name: string;
  phoneNumberId?: string;
  accessToken?: string;
  apiUrl?: string;
}
