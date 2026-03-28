import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ban, CheckCircle2, Clock, Eye, EyeOff, Globe, Loader2, Lock, Plus, Save, Server, Trash2, Users, XCircle } from 'lucide-react';
import { SectionHeader } from '@/components/common';
import { RejectReasonsEditor } from '@/components/settings';
import { useOperators, useSettings } from '@/hooks';
import { operatorNameSchema, settingsSchema } from '@/schemas/settings';
import { useToastStore } from '@/store/toastStore';
import type { SettingsFormValues } from '@/types';
import {
  buildSettingsState,
  createWeeklySchedule,
  DEFAULT_SCHEDULE_INTERVAL,
  removeIntervalAtIndex,
  replaceIntervalAtIndex,
  SETTINGS_WEEK_DAYS,
} from '@/utils';

export default function Settings() {
  const { addToast } = useToastStore();
  const { settings, loading, saving, saveSettings } = useSettings();
  const { operators, addOperator, removeOperator } = useOperators();

  const [newOperator, setNewOperator] = useState('');
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [addingOperator, setAddingOperator] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings ?? {},
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const formValues = watch();
  const generalIntervals = formValues.horarios_intervalos ?? [{ ...DEFAULT_SCHEDULE_INTERVAL }];
  const weeklySchedule = formValues.horarios_semanal ?? {};

  const handleAddOperator = async () => {
    const parsed = operatorNameSchema.safeParse(newOperator);
    if (!parsed.success) {
      setOperatorError(parsed.error.issues[0]?.message ?? 'Nombre de operador invalido');
      return;
    }

    setAddingOperator(true);
    setOperatorError(null);

    const error = await addOperator(parsed.data);

    setAddingOperator(false);

    if (error) {
      setOperatorError(error);
      return;
    }

    setNewOperator('');
  };

  const onSubmit = async (data: SettingsFormValues) => {
    await saveSettings(buildSettingsState(data));
  };

  if (loading) {
    return (
      <div className="page page--center">
        <Loader2 className="spin" size={32} />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuracion</h1>
          <p className="page-subtitle">Ajustes del bot de WhatsApp.</p>
        </div>
        <button className="btn btn--primary" onClick={handleSubmit(onSubmit)} disabled={saving}>
          {saving ? <><Loader2 size={14} className="spin" /> Guardando...</> : <><Save size={14} /> Guardar</>}
        </button>
      </div>

      <div className="s-layout">
        <section className="s-section">
          <SectionHeader icon={<Server size={14} />} title="Sistema" description="Configuracion general del servidor. En la demo, las credenciales de WhatsApp se leen desde .env." />
          <div className="s-fields">
            <div className="s-field">
              <label className="s-label">Variables de entorno requeridas para WhatsApp</label>
              <div className="alert alert--info" style={{ alignItems: 'flex-start' }}>
                <div>
                  <div><code>WABA_VERIFY_TOKEN</code></div>
                  <div><code>WHATSAPP_ACCESS_TOKEN</code></div>
                  <div><code>WABA_PHONE_NUMBER_ID</code></div>
                  <div><code>APP_URL</code></div>
                </div>
              </div>
              <span className="s-hint">Estos valores ya no se guardan desde el dashboard en esta copia demo.</span>
            </div>
            <div className="s-row-2">
              <div className="s-field">
                <label className="s-label" htmlFor="s-timezone">Zona horaria</label>
                <select id="s-timezone" className="s-input" {...register('timezone')}>
                  <option value="America/Bogota">America/Bogota (Colombia)</option>
                  <option value="America/Lima">America/Lima (Peru)</option>
                  <option value="America/Guayaquil">America/Guayaquil (Ecuador)</option>
                  <option value="America/Caracas">America/Caracas (Venezuela)</option>
                  <option value="America/Santiago">America/Santiago (Chile)</option>
                  <option value="America/Argentina/Buenos_Aires">America/Buenos_Aires (Argentina)</option>
                  <option value="America/Mexico_City">America/Mexico_City (Mexico)</option>
                  <option value="America/New_York">America/New_York (EE.UU. Este)</option>
                  <option value="Europe/Madrid">Europe/Madrid (Espana)</option>
                  <option value="UTC">UTC</option>
                </select>
                <span className="s-hint">Zona horaria para los horarios.</span>
              </div>
            </div>
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<Globe size={14} />} title="General" description="Identidad de la aplicacion." />
          <div className="s-fields">
            <div className="s-field">
              <label className="s-label" htmlFor="s-site-name">Nombre del sitio</label>
              <input id="s-site-name" className="s-input" type="text" {...register('site_name')} placeholder="WA Bot" />
              {errors.site_name && <span className="s-error">{errors.site_name.message}</span>}
              <span className="s-hint">Aparece en el sidebar y en el navegador.</span>
            </div>
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<Clock size={14} />} title="Horarios de atencion" description="Rechaza mensajes fuera de horario." />
          <div className="s-fields">
            <div className="s-field">
              <div className="s-toggle-row">
                <span className="s-label" style={{ margin: 0 }}>Habilitar restriccion de horarios</span>
                <button
                  className={`s-toggle${formValues.horarios_enabled ? ' s-toggle--on' : ''}`}
                  onClick={() => setValue('horarios_enabled', !formValues.horarios_enabled)}
                  role="switch"
                  aria-checked={formValues.horarios_enabled}
                  type="button"
                >
                  <span className="s-toggle-knob" />
                </button>
              </div>
            </div>

            {formValues.horarios_enabled && (
              <>
                <div className="s-field">
                  <div className="s-toggle-row">
                    <span className="s-label" style={{ margin: 0 }}>Configurar por dias de la semana</span>
                    <button
                      className={`s-toggle${formValues.horarios_por_dia ? ' s-toggle--on' : ''}`}
                      onClick={() => {
                        const enabledByDay = !formValues.horarios_por_dia;
                        const nextWeeklySchedule =
                          Object.keys(weeklySchedule).length > 0 ? weeklySchedule : createWeeklySchedule(generalIntervals);

                        setValue('horarios_por_dia', enabledByDay);
                        setValue('horarios_semanal', nextWeeklySchedule);
                      }}
                      role="switch"
                      aria-checked={formValues.horarios_por_dia}
                      type="button"
                    >
                      <span className="s-toggle-knob" />
                    </button>
                  </div>
                </div>

                {formValues.horarios_por_dia ? (
                  <div className="s-weekdays">
                    {SETTINGS_WEEK_DAYS.map((day) => {
                      const dayKey = String(day.num);
                      const dayIntervals = weeklySchedule[dayKey] ?? [];

                      return (
                        <div key={day.num} className="s-day-group">
                          <p className="s-day-label">{day.name}</p>
                          {dayIntervals.map((interval, index) => (
                            <div key={index} className="s-interval-row">
                              <div className="s-interval-inputs">
                                <input
                                  type="time"
                                  className="s-input"
                                  value={interval.inicio}
                                  onChange={(event) => {
                                    setValue('horarios_semanal', {
                                      ...weeklySchedule,
                                      [dayKey]: replaceIntervalAtIndex(dayIntervals, index, 'inicio', event.target.value),
                                    });
                                  }}
                                />
                                <span className="s-interval-sep">-</span>
                                <input
                                  type="time"
                                  className="s-input"
                                  value={interval.fin}
                                  onChange={(event) => {
                                    setValue('horarios_semanal', {
                                      ...weeklySchedule,
                                      [dayKey]: replaceIntervalAtIndex(dayIntervals, index, 'fin', event.target.value),
                                    });
                                  }}
                                />
                              </div>
                              <button
                                className="btn-icon btn-icon--danger"
                                type="button"
                                onClick={() => {
                                  setValue('horarios_semanal', {
                                    ...weeklySchedule,
                                    [dayKey]: removeIntervalAtIndex(dayIntervals, index),
                                  });
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                          <button
                            className="btn btn--outline"
                            type="button"
                            onClick={() => {
                              setValue('horarios_semanal', {
                                ...weeklySchedule,
                                [dayKey]: [...dayIntervals, { ...DEFAULT_SCHEDULE_INTERVAL }],
                              });
                            }}
                          >
                            <Plus size={13} /> Anadir
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  generalIntervals.map((interval, index) => (
                    <div key={index} className="s-interval-row">
                      <div className="s-interval-inputs">
                        <input
                          type="time"
                          className="s-input"
                          value={interval.inicio}
                          onChange={(event) => {
                            setValue('horarios_intervalos', replaceIntervalAtIndex(generalIntervals, index, 'inicio', event.target.value));
                          }}
                        />
                        <span className="s-interval-sep">-</span>
                        <input
                          type="time"
                          className="s-input"
                          value={interval.fin}
                          onChange={(event) => {
                            setValue('horarios_intervalos', replaceIntervalAtIndex(generalIntervals, index, 'fin', event.target.value));
                          }}
                        />
                      </div>
                      <button
                        className="btn-icon btn-icon--danger"
                        type="button"
                        onClick={() => {
                          setValue('horarios_intervalos', removeIntervalAtIndex(generalIntervals, index));
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}

                {!formValues.horarios_por_dia && (
                  <button
                    className="btn btn--outline"
                    type="button"
                    onClick={() => setValue('horarios_intervalos', [...generalIntervals, { ...DEFAULT_SCHEDULE_INTERVAL }])}
                  >
                    <Plus size={13} /> Anadir intervalo
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<Clock size={14} />} title="Reinicio por inactividad" description="Reinicia la conversacion si el usuario no responde." />
          <div className="s-fields">
            <div className="s-row-2">
              <div className="s-field">
                <label className="s-label" htmlFor="s-inactividad">Minutos de inactividad</label>
                <input id="s-inactividad" type="number" className="s-input" min="1" max="60" {...register('inactividad_timeout')} placeholder="5" />
                {errors.inactividad_timeout && <span className="s-error">{errors.inactividad_timeout.message}</span>}
                <span className="s-hint">Pasado este tiempo, la conversacion se reinicia.</span>
              </div>
            </div>
            <div className="s-field">
              <label className="s-label" htmlFor="s-msg-reinicio">Mensaje de reinicio</label>
              <textarea
                id="s-msg-reinicio"
                className="s-textarea"
                rows={2}
                {...register('mensaje_reinicio_conversacion')}
                placeholder="Por inactividad se ha reiniciado la conversacion..."
              />
            </div>
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<Users size={14} />} title="Operadores" description="Agentes que pueden atender registros." />
          <div className="s-fields">
            <div className="s-tag-list">
              {operators.length === 0 && <span className="s-hint">No hay operadores.</span>}
              {operators.map((operator) => (
                <span key={operator.id} className="s-tag">
                  {operator.name}
                  <button className="s-tag-remove" type="button" onClick={() => removeOperator(operator.id)}>
                    <XCircle size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div className="s-add-row">
              <input
                className="s-input"
                placeholder="Nombre del operador"
                value={newOperator}
                onChange={(event) => {
                  setNewOperator(event.target.value);
                  setOperatorError(null);
                }}
                onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), handleAddOperator())}
                maxLength={80}
              />
              <button className="btn btn--secondary s-add-btn" type="button" onClick={handleAddOperator} disabled={addingOperator || !newOperator.trim()}>
                {addingOperator ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                Anadir
              </button>
            </div>
            {operatorError && <span className="s-hint s-hint--error">{operatorError}</span>}
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<Ban size={14} />} title="Motivos de rechazo" description="Motivos predefinidos para rechazar una solicitud." />
          <div className="s-fields">
            <RejectReasonsEditor
              value={formValues.reject_reasons || '[]'}
              onChange={(value) => setValue('reject_reasons', value)}
            />
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<CheckCircle2 size={14} />} title="Motivos de aceptacion" description="Motivos predefinidos para aceptar una solicitud." />
          <div className="s-fields">
            <RejectReasonsEditor
              value={formValues.accept_reasons || '[]'}
              onChange={(value) => setValue('accept_reasons', value)}
            />
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<Plus size={14} />} title="Variables de flujo" description="Define las variables que estaran disponibles en el flujo para capturar datos." />
          <div className="s-fields">
            <div className="s-variables-list">
              {(formValues.flow_variables ?? []).map((variable, index) => (
                <div key={index} className="s-add-row" style={{ marginBottom: 10 }}>
                  <input
                    className="s-input"
                    placeholder="ID (ej: nombre_mascota)"
                    value={variable.id}
                    onChange={(e) => {
                      const updated = [...(formValues.flow_variables ?? [])];
                      updated[index] = { ...updated[index], id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') };
                      setValue('flow_variables', updated);
                    }}
                  />
                  <input
                    className="s-input"
                    placeholder="Etiqueta (ej: Nombre de Mascota)"
                    value={variable.label}
                    onChange={(e) => {
                      const updated = [...(formValues.flow_variables ?? [])];
                      updated[index] = { ...updated[index], label: e.target.value };
                      setValue('flow_variables', updated);
                    }}
                  />
                  <div className="s-toggle-row" style={{ padding: '0 8px', gap: '8px' }}>
                    <span className="s-hint" style={{ whiteSpace: 'nowrap' }}>Graficar</span>
                    <button
                      className={`s-toggle s-toggle--small${variable.show_in_reports ? ' s-toggle--on' : ''}`}
                      onClick={() => {
                        const updated = [...(formValues.flow_variables ?? [])];
                        updated[index] = { ...updated[index], show_in_reports: !variable.show_in_reports };
                        setValue('flow_variables', updated, { shouldDirty: true });
                      }}
                      type="button"
                      title="Mostrar en reportes"
                    >
                      <span className="s-toggle-knob" />
                    </button>
                  </div>
                  <button
                    className="btn-icon btn-icon--danger"
                    type="button"
                    onClick={() => {
                      const updated = (formValues.flow_variables ?? []).filter((_, i) => i !== index);
                      setValue('flow_variables', updated);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button
                className="btn btn--outline"
                type="button"
                onClick={() => {
                  const updated = [...(formValues.flow_variables ?? []), { id: '', label: '' }];
                  setValue('flow_variables', updated);
                }}
              >
                <Plus size={13} /> Agregar variable
              </button>
            </div>
            <span className="s-hint">Estas variables definen los datos que se guardaran en los registros.</span>
          </div>
        </section>

        <div className="s-divider" />

        <section className="s-section">
          <SectionHeader icon={<Lock size={14} />} title="Seguridad del dashboard" description="Contrasena de acceso." />
          <div className="s-fields">
            <div className="s-field">
              <div className="s-toggle-row">
                <span className="s-label" style={{ margin: 0 }}>Activar proteccion</span>
                <button
                  className={`s-toggle${formValues.dashboard_password_enabled ? ' s-toggle--on' : ''}`}
                  onClick={() => setValue('dashboard_password_enabled', !formValues.dashboard_password_enabled)}
                  role="switch"
                  aria-checked={formValues.dashboard_password_enabled}
                  type="button"
                >
                  <span className="s-toggle-knob" />
                </button>
              </div>
            </div>
            <div className="s-field">
              <label className="s-label" htmlFor="s-dashboard-pw">Contrasena</label>
              <div className="s-add-row">
                <input
                  id="s-dashboard-pw"
                  className="s-input"
                  type={showPassword ? 'text' : 'password'}
                  {...register('dashboard_password')}
                  placeholder="Introduce una contrasena segura..."
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn--outline s-add-btn"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  style={{ flexShrink: 0 }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
