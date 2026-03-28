import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRegistrations } from '@/services';
import { useWsEvent } from '@/hooks/realtime/useWsEvent';

export function useDashboardData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => ({
      registrations: await getRegistrations(),
    }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dashboardData'] });

  useWsEvent('instances:changed', invalidate);
  useWsEvent('instances:created', invalidate);
  useWsEvent('instances:deleted', invalidate);
  useWsEvent('registrations:new', invalidate);
  useWsEvent('registrations:changed', invalidate);

  return {
    registrations: query.data?.registrations ?? [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: invalidate,
  };
}
