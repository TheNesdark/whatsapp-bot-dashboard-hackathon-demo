import type { Message, SendReplyInput, SendImageReplyInput, GetMessagesParams } from '@/types';
import { apiFetch, apiFetchOk } from '@/utils/api';

export function getMessages(params: GetMessagesParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.instanceId != null) queryParams.append('instanceId', String(params.instanceId));
  if (params.limit != null) queryParams.append('limit', String(params.limit));
  if (params.offset != null) queryParams.append('offset', String(params.offset));
  if (params.mode != null) queryParams.append('mode', params.mode);
  if (params.contact != null) queryParams.append('contact', params.contact);

  return apiFetchOk<Message[]>(`/api/messages?${queryParams.toString()}`);
}

export function sendReply(input: SendReplyInput) {
  return apiFetchOk('/api/messages/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function sendImageReply(input: SendImageReplyInput) {
  const form = new FormData();
  form.append('phone', input.phone);
  form.append('image', input.image);
  if (input.caption) form.append('caption', input.caption);
  if (input.instanceId != null) form.append('instanceId', String(input.instanceId));

  const response = await apiFetch('/api/messages/reply-image', { method: 'POST', body: form });
  return response.json() as Promise<{ success?: boolean; error?: string }>;
}
