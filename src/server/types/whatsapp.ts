// ── Re-exportar tipos compartidos ──────────────────────────────────────────

export type {
  ParsedWebhookMessage,
  UserState,
  WhatsAppInstance,
  InstanceState,
  InstanceRow,
} from '@shared/whatsapp';

export type ButtonOption = { id: string; title: string };
export type ListOption = { id: string; title: string; description?: string };
export type ReplyMessage = string |
{ text: string; buttons: ButtonOption[] } |
{ text: string; buttonText: string; sections: Array<{ title: string; rows: ListOption[] }> };

export interface WabaConfig {
  accessToken: string;
  phoneNumberId: string;
  apiVersion?: string;
}
