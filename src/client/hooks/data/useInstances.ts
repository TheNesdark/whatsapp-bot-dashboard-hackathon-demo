import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createInstance as createInstanceRequest, deleteInstance as deleteInstanceRequest, getInstances } from '@/services';
import type { CreateInstanceInput } from '@/types';
import { useToastStore } from '@/store/toastStore';
import { useWsEvent } from '@/hooks/realtime/useWsEvent';

export function useInstances() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['instances'] });

  const query = useQuery({
    queryKey: ['instances'],
    queryFn: getInstances,
  });

  useWsEvent('instances:changed', invalidate);
  useWsEvent('instances:created', invalidate);
  useWsEvent('instances:deleted', invalidate);

  const createMutation = useMutation({
    mutationFn: (input: CreateInstanceInput) => createInstanceRequest(input),
    onSuccess: () => {
      invalidate();
      useToastStore.getState().addToast('Instancia creada correctamente', 'success');
    },
    onError: (error: Error) => {
      useToastStore.getState().addToast(error.message || 'Error al crear instancia', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteInstanceRequest(id),
    onSuccess: () => {
      invalidate();
      useToastStore.getState().addToast('Instancia eliminada', 'success');
    },
    onError: (error: Error) => {
      useToastStore.getState().addToast(error.message || 'Error al eliminar instancia', 'error');
    },
  });

  const createInstance = async (name: string, phoneNumberId?: string, accessToken?: string, apiUrl?: string) => {
    try {
      return await createMutation.mutateAsync({ name, phoneNumberId, accessToken, apiUrl });
    } catch {
      return null;
    }
  };

  const deleteInstance = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const anyError = query.error ?? createMutation.error ?? deleteMutation.error;

  return {
    instances: query.data ?? [],
    loading: query.isLoading,
    error: anyError ? (anyError as Error).message : null,
    createInstance,
    deleteInstance,
    refetch: invalidate,
  };
}
