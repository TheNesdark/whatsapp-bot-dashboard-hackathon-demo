import type { FlowVariable, HorarioIntervalo, SettingRow, SettingsFormValues, SettingsState } from '@/types';

export const DEFAULT_SCHEDULE_INTERVAL: HorarioIntervalo = {
  inicio: '08:00',
  fin: '18:00',
};

export const SETTINGS_WEEK_DAYS = [
  { num: 1, name: 'Lunes' },
  { num: 2, name: 'Martes' },
  { num: 3, name: 'Miercoles' },
  { num: 4, name: 'Jueves' },
  { num: 5, name: 'Viernes' },
  { num: 6, name: 'Sabado' },
  { num: 0, name: 'Domingo' },
] as const;

function parseWeeklySchedule(value?: string): Record<number, HorarioIntervalo[]> {
  if (!value) return {};
  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<number, HorarioIntervalo[]>;
  } catch {
    return {};
  }
}

function parseIntervals(value?: string): HorarioIntervalo[] {
  if (!value) return [{ ...DEFAULT_SCHEDULE_INTERVAL }];
  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (Array.isArray(parsed)) return parsed as HorarioIntervalo[];
    return [{ ...DEFAULT_SCHEDULE_INTERVAL }];
  } catch {
    return [{ ...DEFAULT_SCHEDULE_INTERVAL }];
  }
}

function parseFlowVariables(value?: string): FlowVariable[] {
  if (!value) return [];
  try {
    let parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'string') parsed = JSON.parse(parsed);
    if (Array.isArray(parsed)) return parsed as FlowVariable[];
    return [];
  } catch {
    return [];
  }
}

export function createWeeklySchedule(intervals: HorarioIntervalo[]): Record<string, HorarioIntervalo[]> {
  const weeklySchedule: Record<string, HorarioIntervalo[]> = {};

  for (let day = 0; day < 7; day += 1) {
    weeklySchedule[String(day)] = intervals.map((interval) => ({ ...interval }));
  }

  return weeklySchedule;
}

export function replaceIntervalAtIndex(
  intervals: HorarioIntervalo[],
  index: number,
  field: keyof HorarioIntervalo,
  value: string
): HorarioIntervalo[] {
  return intervals.map((interval, currentIndex) =>
    currentIndex === index ? { ...interval, [field]: value } : interval
  );
}

export function removeIntervalAtIndex(intervals: HorarioIntervalo[], index: number): HorarioIntervalo[] {
  return intervals.filter((_, currentIndex) => currentIndex !== index);
}

export function hasInvalidScheduleIntervals(schedule: HorarioIntervalo[]): HorarioIntervalo | null {
  return schedule.find((interval) => interval.inicio >= interval.fin) ?? null;
}

export function mapSettingsRowsToState(rows: SettingRow[]): SettingsState {
  const map: Record<string, string> = {};
  for (const setting of rows) map[setting.key] = setting.value;

  return {
    waba_verify_token: map.waba_verify_token ?? '',
    whatsapp_access_token: map.whatsapp_access_token ?? '',
    app_url: map.app_url ?? '',
    timezone: map.timezone ?? 'America/Bogota',
    site_name: map.site_name ?? '',
    horarios_enabled: map.horarios_enabled === 'true',
    horarios_por_dia: map.horarios_por_dia === 'true',
    horarios_intervalos: parseIntervals(map.horarios_intervalos),
    horarios_semanal: parseWeeklySchedule(map.horarios_semanal),
    mensaje_fuera_horario: map.mensaje_fuera_horario ?? '',
    inactividad_timeout: map.inactividad_timeout ?? '5',
    mensaje_reinicio_conversacion: map.mensaje_reinicio_conversacion ?? '',
    dashboard_password_enabled: map.dashboard_password_enabled === 'true',
    dashboard_password: map.dashboard_password ?? '',
    reject_reasons: map.reject_reasons ?? '[]',
    flow_variables: parseFlowVariables(map.flow_variables),
  };
}

export function buildSettingsState(data: SettingsFormValues): SettingsState {
  return {
    ...data,
    waba_verify_token: data.waba_verify_token ?? '',
    whatsapp_access_token: data.whatsapp_access_token ?? '',
    app_url: data.app_url ?? '',
    mensaje_fuera_horario: data.mensaje_fuera_horario ?? '',
    inactividad_timeout: data.inactividad_timeout,
    mensaje_reinicio_conversacion: data.mensaje_reinicio_conversacion ?? '',
    dashboard_password_enabled: data.dashboard_password_enabled,
    dashboard_password: data.dashboard_password ?? '',
    timezone: data.timezone,
    site_name: data.site_name,
    horarios_enabled: data.horarios_enabled,
    horarios_por_dia: data.horarios_por_dia,
    horarios_intervalos: data.horarios_intervalos,
    horarios_semanal: data.horarios_semanal,
    reject_reasons: data.reject_reasons ?? '[]',
    accept_reasons: data.accept_reasons ?? '[]',
    flow_variables: data.flow_variables ?? [],
  };
}
