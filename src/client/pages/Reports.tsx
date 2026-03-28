import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart2,
  Users,
  CheckCheck,
  XCircle,
  MessageSquare,
  Download,
  Loader2,
  Filter,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  Clock,
  Hourglass,
  UserCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { DEFAULT_REPORT_FILTERS, REPORT_DAYS_OPTIONS } from '@/constants/reports';
import { useReports, OperatorRow } from '@/hooks';
import { cn } from '@/utils/cn';
import { buildDayMap, buildDayStatusMap, exportCSV, exportExcel, pct } from '@/utils';
import type { ReportDayCountRow, ReportDayStatusChartRow } from '@/types';

function SummaryCard({
  label, value, icon, variant = 'default', sub,
}: { label: string; value: number; icon: React.ReactNode; variant?: string; sub?: string }) {
  return (
    <div className={cn('rep-stat-card', `rep-stat-card--${variant}`)}>
      <div className="rep-stat-icon">{icon}</div>
      <div>
        <p className="rep-stat-value">{(value ?? 0).toLocaleString('es-CO')}</p>
        <p className="rep-stat-label">{label}</p>
        {sub && <p className="rep-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

function HBarChart({ rows, colorVar = '--accent' }: {
  rows: { label: string; count: number }[];
  colorVar?: string;
}) {
  const chartHeight = Math.max(rows.length * 35 + 40, 120);
  return (
    <div style={{ width: '100%', height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="label"
            type="category"
            width={130}
            tick={{ fontSize: 11, fill: 'var(--text-3)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--border-light)', opacity: 0.4 }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
            {rows.map((_, index) => (
              <Cell key={`cell-${index}`} fill={`var(${colorVar})`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DayChart({ days, color }: { days: ReportDayCountRow[]; color: string }) {
  return (
    <div style={{ width: '100%', height: 300, marginTop: '10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={days} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-4)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-4)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCount)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DayStatusChart({ days }: { days: ReportDayStatusChartRow[] }) {
  return (
    <div style={{ width: '100%', height: 300, marginTop: '10px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={days} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--text-4)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-4)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 500 }}
          />
          <Bar dataKey="accepted" name="Aceptados" fill="var(--success)" radius={[3, 3, 0, 0]} barSize={12} />
          <Bar dataKey="rejected" name="Rechazados" fill="var(--danger)" radius={[3, 3, 0, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Reports() {
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { data, loading, error, refetch } = useReports(filters);

  React.useEffect(() => {
    if (!exportOpen) return;
    const handler = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [exportOpen]);

  const buildDayLabel = (day: string) => format(new Date(day), 'dd/MM', { locale: es });
  const subtractReportDays = (daysBack: number) => subDays(new Date(), daysBack);

  const regDays = useMemo(
    () => buildDayMap(data.byDay, filters.days, buildDayLabel, subtractReportDays),
    [data.byDay, filters.days],
  );
  const statusDays = useMemo(
    () => buildDayStatusMap(data.byDayStatus, filters.days, buildDayLabel, subtractReportDays),
    [data.byDayStatus, filters.days],
  );

  const { total, accepted, rejected, pending, confirming, messages } = data.totals;
  const acceptedPct = pct(accepted, total);
  const rejectedPct = pct(rejected, total);
  const pendingPct = pct(pending, total);

  const daysLabel = REPORT_DAYS_OPTIONS.find((option) => option.value === filters.days)?.label ?? '';
  const hasFilters = filters.days !== DEFAULT_REPORT_FILTERS.days;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Estadisticas y analisis de la actividad del bot.</p>
        </div>
        <div className="rep-header-actions">
          <button className="btn-outline" onClick={refetch} title="Actualizar datos">
            <RefreshCw size={14} />
            Actualizar
          </button>

          <div className="rep-export-wrap" ref={exportRef}>
            <button
              className="btn-primary rep-export-btn"
              disabled={loading || total === 0}
              onClick={() => setExportOpen((open) => !open)}
            >
              <Download size={14} />
              Exportar
              <ChevronDown size={13} className={exportOpen ? 'rep-chevron--open' : ''} />
            </button>
            {exportOpen && (
              <div className="rep-export-menu">
                <button
                  className="rep-export-item"
                  onClick={() => {
                    exportCSV(data, filters);
                    setExportOpen(false);
                  }}
                >
                  <span className="rep-export-ext">CSV</span>
                </button>
                <button
                  className="rep-export-item"
                  onClick={() => {
                    exportExcel(data, filters);
                    setExportOpen(false);
                  }}
                >
                  <span className="rep-export-ext rep-export-ext--excel">XLSX</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rep-filter-bar">
        <div className="rep-filter-icon"><Filter size={13} /></div>

        <div className="rep-filter-group">
          <label className="rep-filter-label">Periodo</label>
          <select
            className="rep-filter-select"
            value={filters.days}
            onChange={(event) => setFilters((current) => ({ ...current, days: event.target.value }))}
          >
            {REPORT_DAYS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button className="rep-filter-reset" onClick={() => setFilters(DEFAULT_REPORT_FILTERS)}>
            Limpiar filtros
          </button>
        )}
      </div>

      {loading && (
        <div className="rep-center">
          <Loader2 size={20} className="spin" />
          <span>Cargando reportes...</span>
        </div>
      )}
      {error && !loading && (
        <div className="rep-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="rep-summary-grid">
            <SummaryCard label="Total registros" value={total} icon={<Users size={18} />} variant="default" />
            <SummaryCard label="Aceptados" value={accepted} icon={<CheckCheck size={18} />} variant="green" />
            <SummaryCard label="Pendientes" value={pending} icon={<Clock size={18} />} variant="amber" />
            <SummaryCard label="En confirmacion" value={confirming} icon={<Hourglass size={18} />} variant="blue" />
            <SummaryCard label="Rechazados" value={rejected} icon={<XCircle size={18} />} variant="red" />
            <SummaryCard label="Total mensajes" value={messages} icon={<MessageSquare size={18} />} variant="default" />
          </div>

          {total > 0 && (
            <div className="rep-card">
              <div className="rep-card-header">
                <BarChart2 size={15} />
                <span>Distribucion por estado</span>
                <span className="rep-card-total">{total.toLocaleString('es-CO')} registros</span>
              </div>
              <div className="rep-status-bar">
                <div className="rep-status-seg rep-status-seg--green" style={{ width: `${acceptedPct}%` }} title={`Aceptados: ${acceptedPct}%`} />
                <div className="rep-status-seg rep-status-seg--amber" style={{ width: `${pendingPct}%` }} title={`Pendientes: ${pendingPct}%`} />
                <div className="rep-status-seg rep-status-seg--red" style={{ width: `${rejectedPct}%` }} title={`Rechazados: ${rejectedPct}%`} />
              </div>
              <div className="rep-status-legend">
                <span className="rep-legend-dot rep-legend-dot--green" /> Aceptados {acceptedPct}%
                <span className="rep-legend-dot rep-legend-dot--amber" /> Pendientes {pendingPct}%
                <span className="rep-legend-dot rep-legend-dot--red" /> Rechazados {rejectedPct}%
              </div>
            </div>
          )}

          <div className="rep-two-col">
            {data.flowVariables
              .filter((variable) => variable.show_in_reports !== false)
              .map((variable, index) => (
                <div key={variable.id} className="rep-card">
                  <div className="rep-card-header">
                    <BarChart2 size={15} />
                    <span>Registros por {variable.label}</span>
                  </div>
                  <HBarChart
                    rows={(data.byVariable[variable.id] || []).map((row) => ({ label: row.label || '(Sin valor)', count: row.count }))}
                    colorVar={index % 2 === 0 ? '--accent' : '--success'}
                  />
                </div>
              ))}
          </div>

          <div className="rep-card">
            <div className="rep-card-header">
              <BarChart2 size={15} />
              <span>Registros - {daysLabel}</span>
            </div>
            <DayChart days={regDays} color="var(--accent)" />
          </div>

          <div className="rep-card">
            <div className="rep-card-header">
              <BarChart2 size={15} />
              <span>Aceptadas vs Rechazadas por dia - {daysLabel}</span>
            </div>
            <DayStatusChart days={statusDays} />
          </div>

          {data.byOperator.length > 0 && (
            <div className="rep-card">
              <div className="rep-card-header">
                <UserCheck size={15} />
                <span>Estadisticas por operador</span>
                <span className="rep-card-total">{data.byOperator.length} operador{data.byOperator.length !== 1 ? 'es' : ''}</span>
              </div>
              <div className="rep-table-wrap">
                <table className="rep-table">
                  <thead>
                    <tr>
                      <th>Operador</th>
                      <th className="rep-th-num">Total</th>
                      <th className="rep-th-num">Aceptados</th>
                      <th className="rep-th-num">Rechazados</th>
                      <th className="rep-th-num">Confirmando</th>
                      <th className="rep-th-num">% Exito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byOperator.map((row: OperatorRow) => (
                      <tr key={row.operator}>
                        <td className="rep-td-label">{row.operator}</td>
                        <td className="rep-td-num">{row.total}</td>
                        <td className="rep-td-num rep-td-green">{row.accepted}</td>
                        <td className="rep-td-num rep-td-red">{row.rejected}</td>
                        <td className="rep-td-num rep-td-amber">{row.confirming}</td>
                        <td className="rep-td-num">
                          {row.accepted + row.rejected > 0
                            ? `${Math.round((row.accepted / (row.accepted + row.rejected)) * 100)}%`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
