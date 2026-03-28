import type { SQLQueryBindings } from 'bun:sqlite';

export interface ReportTotals {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  confirming: number;
  atendidos: number;
}

export interface WhereClause {
  sql: string;
  args: SQLQueryBindings[];
}
