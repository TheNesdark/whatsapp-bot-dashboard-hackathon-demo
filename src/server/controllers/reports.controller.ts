import { Request, Response } from 'express';
import db, { stmts } from '@server/db/db';
import { reportsQuerySchema } from '@server/schemas/reports';
import type { SQLQueryBindings } from 'bun:sqlite';
import type { ReportTotals, WhereClause } from '@server/types';
import type { FlowVariable } from '@shared/settings';

function buildWhere(parts: Array<{ condition: boolean; sql: string; value: SQLQueryBindings }>): WhereClause {
  const active = parts.filter((part) => part.condition);
  if (active.length === 0) return { sql: '', args: [] };

  return {
    sql: `WHERE ${active.map((part) => part.sql).join(' AND ')}`,
    args: active.map((part) => part.value),
  };
}

export function getReportsController(req: Request, res: Response): void {
  try {
    const parsed = reportsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Parametros invalidos para reportes' });
      return;
    }

    const { days } = parsed.data;
    const selectedDays = days === 'all' ? null : Number(days);
    const daysSql = selectedDays ? `created_at >= DATE('now', '-${selectedDays} days')` : '';

    const main = buildWhere([
      { condition: !!selectedDays, sql: daysSql, value: '' },
    ]);
    if (selectedDays) main.args = main.args.filter((arg) => arg !== '');

    const totals = db.prepare<ReportTotals, SQLQueryBindings[]>(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'confirming' THEN 1 ELSE 0 END) as confirming,
        SUM(CASE WHEN status IN ('accepted','rejected') THEN 1 ELSE 0 END) as atendidos
      FROM registrations ${main.sql}
    `).get(...main.args)!;

    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM registrations ${main.sql} GROUP BY status
    `).all(...main.args) as { status: string; count: number }[];

    // Reportes dinámicos basados en variables de flujo
    const flowVarsJson = (stmts.selectSettingByKey.get('flow_variables') as { value: string })?.value || '[]';
    const flowVars = JSON.parse(flowVarsJson) as FlowVariable[];

    const byVariable: Record<string, { label: string; count: number }[]> = {};

    for (const variable of flowVars) {
      const rows = db.prepare(`
        SELECT value as label, COUNT(*) as count
        FROM registration_data rd
        JOIN registrations r ON rd.registration_id = r.id
        ${main.sql ? main.sql + ' AND rd.variable_key = ?' : 'WHERE rd.variable_key = ?'}
        GROUP BY value
        ORDER BY count DESC
      `).all(...main.args, variable.id) as { label: string; count: number }[];

      byVariable[variable.id] = rows;
    }

    const byDay = db.prepare(`
      SELECT DATE(created_at) as day, COUNT(*) as count FROM registrations ${main.sql} GROUP BY DATE(created_at) ORDER BY day ASC
    `).all(...main.args) as { day: string; count: number }[];

    const byDayStatus = db.prepare(`
      SELECT DATE(created_at) as day,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM registrations ${main.sql} GROUP BY DATE(created_at) ORDER BY day ASC
    `).all(...main.args) as { day: string; accepted: number; rejected: number }[];

    const msgWhere = selectedDays ? "WHERE created_at >= DATE('now', '-' || ? || ' days')" : '';
    const msgArgs = selectedDays ? [selectedDays] : [];
    const totalMessages = (db.prepare(`SELECT COUNT(*) as count FROM messages ${msgWhere}`).get(...msgArgs) as { count: number }).count;

    const byOperator = db.prepare(`
      SELECT
        COALESCE(attended_by, '(Sin asignar)') as operator,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'confirming' THEN 1 ELSE 0 END) as confirming,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'attending' THEN 1 ELSE 0 END) as attending
      FROM registrations ${main.sql}
      GROUP BY COALESCE(attended_by, '(Sin asignar)') ORDER BY total DESC
    `).all(...main.args);

    res.json({
      totals: { ...totals, messages: totalMessages },
      byStatus,
      byVariable,
      flowVariables: flowVars,
      byDay,
      byDayStatus,
      byOperator,
    });
  } catch (err) {
    console.error('[reports]', err);
    res.status(500).json({ error: 'Error al generar reportes' });
  }
}
