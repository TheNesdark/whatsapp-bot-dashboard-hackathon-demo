import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetchOk } from '@/utils/api';
import { useWsEvent } from '@/hooks/realtime/useWsEvent';
import { useToastStore } from '@/store/toastStore';
import type { Operator } from '@/types';

export function useOperators() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['operators'] });

  const query = useQuery({
    queryKey: ['operators'],
    queryFn: () => apiFetchOk<Operator[]>('/api/operators'),
  });

  const addMutation = useMutation({
    mutationFn: (name: string) =>
      apiFetchOk('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      invalidate();
      useToastStore.getState().addToast('Operador añadido correctamente', 'success');
    },
    onError: (err: Error) => {
      useToastStore.getState().addToast(err.message || 'Error al añadir operador', 'error');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetchOk(`/api/operators/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      useToastStore.getState().addToast('Operador eliminado', 'success');
    },
    onError: (err: Error) => {
      useToastStore.getState().addToast(err.message || 'Error al eliminar operador', 'error');
    },
  });

  useWsEvent('operators:changed', invalidate);

  return {
    operators: query.data || [],
    loading: query.isLoading,
    addOperator: async (name: string) => {
      try {
        await addMutation.mutateAsync(name);
        return null;
      } catch (e: any) {
        return e.message;
      }
    },
    removeOperator: async (id: number) => {
      await removeMutation.mutateAsync(id);
    },
    refetch: query.refetch
  };
}
