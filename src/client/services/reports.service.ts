import { apiFetch } from '@/utils/api';
import type { ReportFilters, ReportsData } from '@/types';

export async function getReports(filters: ReportFilters) {
  const params = new URLSearchParams();
  if (filters.days && filters.days !== 'all') params.set('days', filters.days);

  const response = await apiFetch(`/api/reports${params.size ? `?${params}` : ''}`);
  if (!response.ok) throw new Error(`Error ${response.status}`);

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error('La respuesta del servidor no es JSON. Verifica que el servidor este activo.');
  }

  return response.json() as Promise<ReportsData>;
}
