import { stmts } from '@server/db/db';
import type { HorarioConfig, InactividadConfig, HorarioIntervalo } from '@server/types/index';
import { instanceManager, DEFAULT_INSTANCE_ID } from './state';
import { getTimezone } from '@server/utils/sysConfig';

// ── Settings con caché por instancia ─────────────────────────────────────────

export function getSettings(instanceId: number = DEFAULT_INSTANCE_ID): Record<string, string> {
  const inst = instanceManager.get(instanceId);
  if (inst?.settingsCache) return inst.settingsCache;

  const cache = (stmts.selectAllSettings.all() as { key: string; value: string }[])
    .reduce<Record<string, string>>((acc, row) => { acc[row.key] = row.value; return acc; }, {});

  if (inst) inst.settingsCache = cache;
  return cache;
}

// ── Helpers de parseo ─────────────────────────────────────────────────────────

function parseJsonSetting<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

// ── Configuración de horarios ─────────────────────────────────────────────────

export function getHorarioConfig(s: Record<string, string>): HorarioConfig {
  const DEFAULT_INTERVALOS: HorarioIntervalo[] = [{ inicio: '08:00', fin: '18:00' }];

  let intervalos = parseJsonSetting<HorarioIntervalo[]>(s.horarios_intervalos, DEFAULT_INTERVALOS);

  let semanal: Record<number, HorarioIntervalo[]> | undefined;
  if (s.horarios_semanal) {
    const parsed = parseJsonSetting<Record<string, HorarioIntervalo[]>>(s.horarios_semanal, {});
    const entries = Object.entries(parsed)
      .filter(([k, v]) => {
        const n = Number(k);
        return Number.isInteger(n) && n >= 0 && n <= 6 && Array.isArray(v);
      });
    if (entries.length > 0) {
      semanal = Object.fromEntries(entries.map(([k, v]) => [Number(k), v]));
    }
  }

  return {
    enabled: s.horarios_enabled === 'true',
    intervalos,
    semanal,
    mensajeRechazo: s.mensaje_fuera_horario || 'Lo sentimos, estamos fuera del horario de atención.',
  };
}

// ── Configuración de inactividad ──────────────────────────────────────────────

export function getInactividadConfig(s: Record<string, string>): InactividadConfig {
  const raw = parseInt(s.inactividad_timeout ?? '5', 10);
  const timeoutMinutos = Number.isFinite(raw) && raw >= 1 && raw <= 60 ? raw : 5;
  return {
    timeoutMinutos,
    mensajeReinicio: s.mensaje_reinicio_conversacion || 'Por inactividad se ha reiniciado la conversación. Escríbenos nuevamente para iniciar.',
  };
}

// ── Verificación de horario ────────────────────────────────────────────────────

/** Convierte "HH:MM" a minutos desde medianoche */
function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h === 24 ? 0 : h) * 60 + m;
}

function checkIntervals(current: number, arr: HorarioIntervalo[] | undefined): boolean {
  if (!arr || arr.length === 0) return true;
  return arr.some(({ inicio, fin }) => {
    const start = toMins(inicio);
    const end = toMins(fin);
    if (start === end) return true;
    return start < end ? current >= start && current < end : current >= start || current < end;
  });
}

export function isWithinSchedule(h: HorarioConfig): boolean {
  if (!h.enabled) return true;

  const tz = getTimezone();
  const now = new Date();
  
  // Obtener partes de la fecha en la zona horaria especificada
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const getPart = (type: string) => parts.find(p => p.type === type)?.value;
  
  const hVal = parseInt(getPart('hour') ?? '0', 10);
  const mVal = parseInt(getPart('minute') ?? '0', 10);
  const weekday = getPart('weekday');
  
  // Mapear weekday a numero (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const days: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const day = days[weekday ?? 'Sun'] ?? 0;
  
  const current = hVal * 60 + mVal;

  // Si hay configuración por día de semana, tiene prioridad
  if (h.semanal?.[day]) return checkIntervals(current, h.semanal[day]);
  return checkIntervals(current, h.intervalos);
}
