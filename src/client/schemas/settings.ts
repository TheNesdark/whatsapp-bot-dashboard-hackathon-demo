import * as z from 'zod';

const timeIntervalSchema = z.object({
  inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'HH:MM'),
  fin: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'HH:MM'),
});

export const operatorNameSchema = z.string().trim().min(1, 'El nombre del operador es obligatorio').max(80, 'El nombre del operador es demasiado largo');

export const settingsSchema = z.object({
  waba_verify_token: z.string().optional(),
  whatsapp_access_token: z.string().optional(),
  app_url: z.string().url('Debe ser una URL valida').or(z.literal('')),
  timezone: z.string(),
  site_name: z.string().min(2, 'El nombre del sitio debe tener al menos 2 caracteres'),
  horarios_enabled: z.boolean(),
  horarios_por_dia: z.boolean().optional(),
  horarios_intervalos: z.array(timeIntervalSchema),
  horarios_semanal: z.record(z.string(), z.array(timeIntervalSchema)).optional(),
  mensaje_fuera_horario: z.string().optional(),
  inactividad_timeout: z.string().regex(/^\d+$/, 'Debe ser un numero'),
  mensaje_reinicio_conversacion: z.string().optional(),
  dashboard_password_enabled: z.boolean(),
  dashboard_password: z.string().optional(),
  reject_reasons: z.string().optional(),
  accept_reasons: z.string().optional(),
  flow_variables: z.array(z.object({
    id: z.string().min(1, 'El ID es obligatorio').regex(/^[a-z0-9_]+$/, 'Solo minusculas, numeros y guiones bajos'),
    label: z.string().min(1, 'La etiqueta es obligatoria'),
    show_in_reports: z.boolean().optional(),
  })).optional(),
}).superRefine((data, ctx) => {
  const addIntervalIssue = (path: Array<string | number>, inicio: string, fin: string) => {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: `El intervalo ${inicio}-${fin} es invalido: inicio debe ser anterior a fin.`,
    });
  };

  if (data.horarios_enabled) {
    if (data.horarios_por_dia && data.horarios_semanal) {
      for (const [day, intervals] of Object.entries(data.horarios_semanal)) {
        const invalidIndex = intervals.findIndex((interval) => interval.inicio >= interval.fin);
        if (invalidIndex >= 0) {
          const invalid = intervals[invalidIndex];
          addIntervalIssue(['horarios_semanal', day, invalidIndex], invalid.inicio, invalid.fin);
          break;
        }
      }
    } else {
      const invalidIndex = data.horarios_intervalos.findIndex((interval) => interval.inicio >= interval.fin);
      if (invalidIndex >= 0) {
        const invalid = data.horarios_intervalos[invalidIndex];
        addIntervalIssue(['horarios_intervalos', invalidIndex], invalid.inicio, invalid.fin);
      }
    }
  }

  if (data.dashboard_password_enabled && !data.dashboard_password?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dashboard_password'],
      message: 'Debes establecer una contrasena antes de activar la proteccion.',
    });
  }
});
