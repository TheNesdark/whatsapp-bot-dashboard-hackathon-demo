import { z } from 'zod';

const timeIntervalSchema = z.object({
  inicio: z.string(),
  fin: z.string(),
});

export const saveSettingsSchema = z.object({
  waba_verify_token: z.string().optional(),
  whatsapp_access_token: z.string().optional(),
  app_url: z.string().optional(),
  timezone: z.string().optional(),
  site_name: z.string().optional(),
  horarios_enabled: z.union([z.boolean(), z.string()]).optional(),
  horarios_intervalos: z.array(timeIntervalSchema).optional(),
  mensaje_fuera_horario: z.string().optional(),
  horarios_por_dia: z.union([z.boolean(), z.string()]).optional(),
  horarios_semanal: z.record(z.string(), z.array(timeIntervalSchema)).optional(),
  inactividad_timeout: z.union([z.string(), z.number()]).optional(),
  mensaje_reinicio_conversacion: z.string().optional(),
  dashboard_password_enabled: z.union([z.boolean(), z.string()]).optional(),
  dashboard_password: z.string().optional(),
  reject_reasons: z.union([z.string(), z.array(z.string())]).optional(),
  flow_variables: z.array(z.object({
    id: z.string(),
    label: z.string(),
  })).optional(),
}).strict();
