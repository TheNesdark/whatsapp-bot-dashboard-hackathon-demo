import { z } from 'zod';
import { settingsSchema } from '@/schemas/settings';
import { rejectRegistrationSchema } from '@/schemas/registrations';
import { replyMessageSchema } from '@/schemas/messages';
import { createInstanceFormSchema } from '@/schemas/instances';
import { loginSchema } from '@/schemas/auth';

export interface ModalTarget {
  id: number;
  phone: string;
  event?: string;
}

export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type RejectRegistrationValues = z.infer<typeof rejectRegistrationSchema>;
export type ReplyMessageValues = z.infer<typeof replyMessageSchema>;
export type CreateInstanceFormValues = z.infer<typeof createInstanceFormSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
