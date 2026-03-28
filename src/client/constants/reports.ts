import type { ReportFilters } from '@/hooks';

export const REPORT_DAYS_OPTIONS = [
  { value: '7', label: 'Ultimos 7 dias' },
  { value: '30', label: 'Ultimos 30 dias' },
  { value: '90', label: 'Ultimos 90 dias' },
  { value: 'all', label: 'Todo el tiempo' },
] as const;

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  eps: '',
  appt: '',
  days: '30',
};
