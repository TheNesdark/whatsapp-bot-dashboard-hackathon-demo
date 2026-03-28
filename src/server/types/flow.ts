import type { ReplyMessage } from './whatsapp';

export type ReplyFn = (msg: ReplyMessage, typingMs?: number) => Promise<void>;
export type OperatorApprovalEvent = 'approved' | 'rejected' | 'needs_info';
export type RuntimeImage = { buffer: Buffer; mimeType?: string; filename?: string };
export type FlowRuntimeContext = { 
  approvalImage?: RuntimeImage;
  rejectionReason?: string;
};

export interface RegistrationConversationRow {
  id: number;
  status: string;
  instance_id: number;
  whatsapp_number: string;
}
