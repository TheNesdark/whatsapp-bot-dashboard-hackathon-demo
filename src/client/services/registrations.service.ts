import type { Registration } from '@/types';
import { apiFetch, apiFetchOk } from '@/utils/api';

export function getRegistrations() {
  return apiFetch('/api/registrations').then((response) => response.json() as Promise<Registration[]>);
}

export function claimRegistration(id: number, attendedBy: string) {
  return apiFetch('/api/registrations/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, attended_by: attendedBy }),
  });
}

export function releaseRegistration(id: number) {
  return apiFetch('/api/registrations/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
}

export function acceptRegistrationRequest(input: { id: number; phone: string; image: File | null; agentName?: string; event?: string; reason?: string }) {
  const formData = new FormData();
  formData.append('id', String(input.id));
  if (input.agentName) formData.append('attended_by', input.agentName);
  if (input.image) formData.append('image', input.image);
  if (input.event) formData.append('event', input.event);
  if (input.reason) formData.append('reason', input.reason);

  return apiFetchOk('/api/registrations/approve', { method: 'POST', body: formData });
}

export function rejectRegistrationRequest(input: { id: number; phone: string; reason: string; agentName?: string; image: File | null }) {
  const formData = new FormData();
  formData.append('id', String(input.id));
  formData.append('phone', input.phone);
  if (input.reason) formData.append('reason', input.reason);
  if (input.agentName) formData.append('attended_by', input.agentName);
  if (input.image) formData.append('image', input.image);

  return apiFetchOk('/api/registrations/reject', { method: 'POST', body: formData });
}
