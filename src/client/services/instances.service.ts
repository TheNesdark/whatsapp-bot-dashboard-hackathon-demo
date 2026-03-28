import type { WhatsAppInstance, CreateInstanceInput } from '@/types';
import { apiFetchOk } from '@/utils/api';

export function getInstances() {
  return apiFetchOk<WhatsAppInstance[]>('/api/instances');
}

export function createInstance(input: CreateInstanceInput) {
  return apiFetchOk<WhatsAppInstance>('/api/instances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export function deleteInstance(id: number) {
  return apiFetchOk(`/api/instances/${id}`, { method: 'DELETE' });
}
