import type { FlowVariable } from './settings';

export interface ReportFilters {
  eps: string;
  appt: string;
  days: string;
}

export interface ReportTotals {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  confirming: number;
  atendidos: number;
  messages: number;
}

export interface DayRow {
  day: string;
  count: number;
}

export interface DayStatusRow {
  day: string;
  accepted: number;
  rejected: number;
}

export interface ReportDayCountRow {
  day: string;
  label: string;
  count: number;
}

export interface ReportDayStatusChartRow {
  day: string;
  label: string;
  accepted: number;
  rejected: number;
}

export interface OperatorRow {
  operator: string;
  total: number;
  accepted: number;
  rejected: number;
  confirming: number;
  pending: number;
  attending: number;
}

export interface ReportsData {
  totals: ReportTotals;
  byStatus: { status: string; count: number }[];
  byVariable: Record<string, { label: string; count: number }[]>;
  flowVariables: FlowVariable[];
  byDay: DayRow[];
  byDayStatus: DayStatusRow[];
  byOperator: OperatorRow[];
}
