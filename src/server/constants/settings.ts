export const SETTINGS_JSON_FIELDS = new Set(['horarios_intervalos', 'horarios_semanal', 'flow_variables', 'reject_reasons', 'accept_reasons']);

export const ALLOWED_SETTINGS_KEYS = [
  'waba_verify_token',
  'whatsapp_access_token',
  'app_url',
  'timezone',
  'site_name',
  'horarios_enabled',
  'horarios_intervalos',
  'mensaje_fuera_horario',
  'horarios_por_dia',
  'horarios_semanal',
  'inactividad_timeout',
  'mensaje_reinicio_conversacion',
  'dashboard_password_enabled',
  'dashboard_password',
  'reject_reasons',
  'accept_reasons',
  'flow_variables',
] as const;

export const ALLOWED_SETTINGS = new Set<string>(ALLOWED_SETTINGS_KEYS);

export const MAX_SETTING_VALUE_LENGTH = 20_000;

export const DEFAULT_SETTINGS: Record<string, string> = {
  waba_verify_token: 'verify',
  whatsapp_access_token: '',
  app_url: 'http://localhost:3002',
  timezone: 'America/Bogota',
  site_name: 'Hackathon Demo',
  horarios_enabled: 'false',
  horarios_intervalos: JSON.stringify([{ inicio: '08:00', fin: '18:00' }]),
  mensaje_fuera_horario: 'Estamos fuera de horario. Vuelve a intentar mas tarde.',
  horarios_por_dia: 'false',
  horarios_semanal: '{}',
  inactividad_timeout: '5',
  mensaje_reinicio_conversacion: 'La conversacion se reinicio por inactividad. Escribe de nuevo para comenzar.',
  dashboard_password_enabled: 'false',
  dashboard_password: '',
  flow_variables: JSON.stringify([
    { id: 'name', label: 'Nombre', show_in_reports: false },
    { id: 'cedula', label: 'Codigo o Referencia', show_in_reports: false },
    { id: 'phone', label: 'Canal de Contacto', show_in_reports: false },
    { id: 'address', label: 'Equipo o Ciudad', show_in_reports: false },
    { id: 'eps', label: 'Categoria', show_in_reports: true },
    { id: 'appointmentType', label: 'Tipo de Solicitud', show_in_reports: true }
  ]),
};
