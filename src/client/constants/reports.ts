import type { ReportFilters } from '@/hooks';

export const REPORT_DAYS_OPTIONS = [
  { value: '7', label: 'Ãšltimos 7 dÃ­as' },
  { value: '30', label: 'Ãšltimos 30 dÃ­as' },
  { value: '90', label: 'Ãšltimos 90 dÃ­as' },
  { value: 'all', label: 'Todo el tiempo' },
] as const;

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  eps: '',
  appt: '',
  days: '30',
};
