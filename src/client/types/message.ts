// ── Re-exportar tipos compartidos ──────────────────────────────────────────

export type { Message, Thread } from '@shared/message';

export interface SendReplyInput {
  phone: string;
  message: string;
  instanceId?: number;
}

export interface SendImageReplyInput {
  phone: string;
  image: File;
  caption?: string;
  instanceId?: number;
}

export interface GetMessagesParams {
  instanceId?: number;
  limit?: number;
  offset?: number;
  mode?: 'threads' | 'history';
  contact?: string;
}
