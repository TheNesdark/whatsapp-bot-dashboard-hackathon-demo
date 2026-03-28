import type { SettingRow, SettingsState } from '@/types';
import { mapSettingsRowsToState } from '@/utils';
import { apiFetch } from '@/utils/api';

function serializeSettings(settings: SettingsState) {
  return {
    waba_verify_token: settings.waba_verify_token,
    whatsapp_access_token: settings.whatsapp_access_token,
    app_url: settings.app_url,
    timezone: settings.timezone,
    site_name: settings.site_name,
    horarios_enabled: settings.horarios_enabled.toString(),
    horarios_por_dia: settings.horarios_por_dia ? 'true' : 'false',
    horarios_intervalos: settings.horarios_intervalos,
    horarios_semanal: settings.horarios_semanal || {},
    mensaje_fuera_horario: settings.mensaje_fuera_horario,
    inactividad_timeout: settings.inactividad_timeout,
    mensaje_reinicio_conversacion: settings.mensaje_reinicio_conversacion,
    dashboard_password_enabled: settings.dashboard_password_enabled.toString(),
    dashboard_password: settings.dashboard_password,
    reject_reasons: settings.reject_reasons,
    flow_variables: settings.flow_variables || [],
  };
}

export async function getSettings() {
  const response = await apiFetch('/api/settings');
  const data = await response.json();
  return mapSettingsRowsToState(data as SettingRow[]);
}

export function saveSettings(settings: SettingsState) {
  return apiFetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serializeSettings(settings)),
  });
}
