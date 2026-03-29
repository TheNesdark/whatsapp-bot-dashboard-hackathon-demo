import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptRegistrationRequest, rejectRegistrationRequest } from '@/services';
import type { Registration } from '@/types';
import { useToastStore } from '@/store/toastStore';

export function useRegistrationActions() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] });

  const acceptMutation = useMutation({
    mutationFn: async ({ id, phone, image, agentName, event, reason }: { id: number; phone: string; image: File | null; agentName?: string; event?: string; reason?: string }) => {
      await acceptRegistrationRequest({ id, phone, image, agentName, event, reason });
    },
    onSuccess: (_, variables) => {
      invalidate();
      const actionLabel = variables.event === 'approved' ? 'aceptada' : 'procesada';
      useToastStore.getState().addToast(`Cita ${actionLabel} correctamente`, 'success');
    },
    onError: (error: Error) => {
      useToastStore.getState().addToast(error.message || 'Error al procesar cita', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, phone, reason, agentName, image }: { id: number; phone: string; reason: string; agentName?: string; image: File | null }) =>
      rejectRegistrationRequest({ id, phone, reason, agentName, image }),
    onSuccess: () => {
      invalidate();
      useToastStore.getState().addToast('Cita rechazada', 'success');
    },
    onError: (error: Error) => {
      useToastStore.getState().addToast(error.message || 'Error al rechazar cita', 'error');
    },
  });

  const acceptRegistration = async (id: number, phone: string, image: File | null = null, agentName?: string, event?: string, reason?: string) => {
    try {
      await acceptMutation.mutateAsync({ id, phone, image, agentName, event, reason });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error de red' };
    }
  };

  const rejectRegistration = async (id: number, phone: string, reason: string, agentName?: string, image: File | null = null) => {
    try {
      await rejectMutation.mutateAsync({ id, phone, reason, agentName, image });
      return { success: true };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error.message : 'Error de red' };
    }
  };

  return { acceptRegistration, rejectRegistration };
}

export function useRegistrationStats(registrations: Registration[]) {
  const stats = {
    total: Array.isArray(registrations) ? registrations.length : 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  };

  if (Array.isArray(registrations)) {
    registrations.forEach((reg) => {
      if (reg.status === 'pending') stats.pending++;
      else if (reg.status === 'accepted') stats.accepted++;
      else if (reg.status === 'rejected') stats.rejected++;
    });
  }

  return stats;
}

export function useRegistrationFilters(registrations: Registration[]) {
  // Ya no tenemos una columna fija de Área, podriamos buscar en data pero por ahora deshabilitamos el filtro especifico
  const areaList: string[] = [];

  const filterRegistrations = useCallback(
    (search: string, statusFilter: string, _areaFilter: string): Registration[] => {
      if (!Array.isArray(registrations)) return [];
      const query = search.toLowerCase();
      return registrations.filter((registration) => {
        const matchesSearch =
          registration.whatsapp_number.toLowerCase().includes(query) ||
          Object.values(registration.data || {}).some((val) => String(val).toLowerCase().includes(query));

        return (
          matchesSearch &&
          (statusFilter === 'all' || registration.status === statusFilter)
        );
      });
    },
    [registrations],
  );

  return { areaList, filterRegistrations };
}
