import { useEffect, useCallback } from 'react';
import { useHelpRequestStore } from '@/store/helpRequestStore';
import type { HelpRequest } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { useWsEvent } from '@/hooks/realtime/useWsEvent';
import { apiFetchOk } from '@/utils/api';

export function useHelpRequests() {
  const { requests, setRequests, addRequest, removeRequest } = useHelpRequestStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    apiFetchOk<HelpRequest[]>('/api/help-requests')
      .then(setRequests)
      .catch(err => console.error('Error cargando solicitudes de ayuda:', err));
  }, [setRequests]);

  // Escuchar eventos WebSocket
  useWsEvent('help:request', useCallback((data: unknown) => {
    const request = data as HelpRequest;
    addRequest(request);
    addToast(`🔔 ${request.full_name || request.phone_number} solicita ayuda`, 'info');
  }, [addRequest, addToast]));

  useWsEvent('help:resolved', useCallback((data: unknown) => {
    const { id } = data as { id: number };
    removeRequest(id);
  }, [removeRequest]));

  const resolveRequest = useCallback((id: number, message?: string) =>
    apiFetchOk(`/api/help-requests/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }), []);

  const deleteRequest = useCallback((id: number) =>
    apiFetchOk(`/api/help-requests/${id}`, { method: 'DELETE' }), []);

  return {
    requests,
    resolveRequest,
    deleteRequest,
  };
}
