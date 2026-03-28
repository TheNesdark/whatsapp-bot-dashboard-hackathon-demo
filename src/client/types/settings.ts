import type { FlowVariable, HorarioIntervalo } from '@shared/settings';

export type { FlowVariable, HorarioIntervalo };

export interface SettingRow {
  key: string;
  value: string;
}

export interface SettingsState {
  waba_verify_token: string;
  whatsapp_access_token: string;
  app_url: string;
  timezone: string;
  site_name: string;
  horarios_enabled: boolean;
  horarios_por_dia?: boolean;
  horarios_intervalos: HorarioIntervalo[];
  horarios_semanal?: Record<string, HorarioIntervalo[]>;
  mensaje_fuera_horario?: string;
  inactividad_timeout: string;
  mensaje_reinicio_conversacion?: string;
  dashboard_password_enabled: boolean;
  dashboard_password?: string;
  reject_reasons?: string;
  accept_reasons?: string;
  flow_variables?: FlowVariable[];
}
