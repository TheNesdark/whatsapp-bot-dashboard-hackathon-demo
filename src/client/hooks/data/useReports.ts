import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getReports } from '@/services';
import type { DayRow, DayStatusRow, OperatorRow, ReportFilters, ReportsData, ReportTotals } from '@/types';
import { useWsEvent } from '@/hooks/realtime/useWsEvent';

export type { ReportFilters, ReportTotals, DayRow, DayStatusRow, OperatorRow, ReportsData } from '@/types';

const EMPTY: ReportsData = {
  totals: { total: 0, pending: 0, accepted: 0, rejected: 0, confirming: 0, atendidos: 0, messages: 0 },
  byStatus: [],
  byVariable: {},
  flowVariables: [],
  byDay: [],
  byDayStatus: [],
  byOperator: [],
};

export function useReports(filters: ReportFilters) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reports'] });

  const query = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => getReports(filters),
    staleTime: 60_000,
  });

  useWsEvent('registrations:new', invalidate);
  useWsEvent('registrations:changed', invalidate);
  useWsEvent('settings:changed', invalidate);

  return {
    data: query.data ?? EMPTY,
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    refetch: invalidate,
  };
}
