import * as XLSX from 'xlsx';
import type {
  DayRow,
  DayStatusRow,
  ReportDayCountRow,
  ReportDayStatusChartRow,
  ReportFilters,
  ReportsData,
} from '@/types';

export function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function buildDayMap(
  rows: DayRow[],
  days: string,
  buildLabel: (day: string) => string,
  subtractDays: (daysBack: number) => Date,
): ReportDayCountRow[] {
  const map: Record<string, number> = {};
  for (const row of rows) map[row.day] = row.count;

  const end = new Date();
  const start =
    days === 'all'
      ? new Date(Math.min(...rows.map((row) => new Date(row.day).getTime())))
      : subtractDays(parseInt(days, 10) - 1);

  const result: ReportDayCountRow[] = [];
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const date = new Date(current);
    const key = date.toISOString().slice(0, 10);
    result.push({
      day: key,
      label: buildLabel(key),
      count: map[key] ?? 0,
    });
  }

  return result;
}

export function buildDayStatusMap(
  rows: DayStatusRow[],
  days: string,
  buildLabel: (day: string) => string,
  subtractDays: (daysBack: number) => Date,
): ReportDayStatusChartRow[] {
  const map: Record<string, { accepted: number; rejected: number }> = {};
  for (const row of rows) map[row.day] = { accepted: row.accepted, rejected: row.rejected };

  const end = new Date();
  const start =
    days === 'all'
      ? new Date(Math.min(...rows.map((row) => new Date(row.day).getTime())))
      : subtractDays(parseInt(days, 10) - 1);

  const result: ReportDayStatusChartRow[] = [];
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const date = new Date(current);
    const key = date.toISOString().slice(0, 10);
    const value = map[key] ?? { accepted: 0, rejected: 0 };
    result.push({
      day: key,
      label: buildLabel(key),
      ...value,
    });
  }

  return result;
}

export function exportCSV(data: ReportsData, filters: ReportFilters) {
  const meta = [
    `Reporte generado: ${new Date().toLocaleString('es-CO')}`,
    `Filtros: Periodo=${filters.days === 'all' ? 'Todo' : `${filters.days} dias`}`,
    '',
  ];
  const rows: string[] = [...meta, 'Seccion,Etiqueta,Cantidad'];
  for (const row of data.byStatus) rows.push(`Estado,${row.status},${row.count}`);

  for (const variable of data.flowVariables) {
    const variableData = data.byVariable[variable.id] || [];
    for (const row of variableData) {
      rows.push(`${variable.label},${row.label || '(Vacio)'},${row.count}`);
    }
  }

  for (const row of data.byDay) rows.push(`Registros por Dia,${row.day},${row.count}`);
  for (const row of data.byDayStatus) rows.push(`Aceptadas/Rechazadas,${row.day},${row.accepted},${row.rejected}`);

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportExcel(data: ReportsData, filters: ReportFilters) {
  const workbook = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filterInfo = `Periodo: ${filters.days === 'all' ? 'Todo' : `${filters.days} dias`}`;

  const summaryRows = [
    ['Reporte WhatsApp Bot', dateStr],
    ['Filtros aplicados', filterInfo],
    [],
    ['Indicador', 'Valor'],
    ['Total registros', data.totals.total],
    ['Total atendidos', data.totals.atendidos],
    ['Aceptados', data.totals.accepted],
    ['Pendientes', data.totals.pending],
    ['En confirmacion', data.totals.confirming],
    ['Rechazados', data.totals.rejected],
    ['Total mensajes', data.totals.messages],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Resumen');

  for (const variable of data.flowVariables) {
    const variableData = data.byVariable[variable.id] || [];
    const rows = [[variable.label, 'Cantidad'], ...variableData.map((row) => [row.label || '(Vacio)', row.count])];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), variable.label.slice(0, 31));
  }

  const byDayRows = [['Fecha', 'Registros'], ...data.byDay.map((row) => [row.day, row.count])];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(byDayRows), 'Registros por Dia');

  const byStatusDayRows = [
    ['Fecha', 'Aceptadas', 'Rechazadas'],
    ...data.byDayStatus.map((row) => [row.day, row.accepted, row.rejected]),
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(byStatusDayRows), 'Aceptadas vs Rechazadas');

  const operatorRows = [
    ['Operador', 'Total', 'Aceptados', 'Rechazados', 'Confirmando', 'Pendientes', 'En atencion'],
    ...data.byOperator.map((row) => [row.operator, row.total, row.accepted, row.rejected, row.confirming, row.pending, row.attending]),
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(operatorRows), 'Por Operador');

  XLSX.writeFile(workbook, `reporte-${dateStr}.xlsx`);
}
