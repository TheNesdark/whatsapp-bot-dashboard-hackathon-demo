import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type {
  ConditionBranch,
  FlowNode,
  MenuOption,
  OperatorApprovalBranch,
} from '@shared/flow';
import type { FlowVariable } from '@shared/settings';
import { useSettings } from '@/hooks';
import type { NodePropertiesPanelProps } from '@/types';

type ApprovalEvent = OperatorApprovalBranch['event'];

const VALIDATION_OPTIONS = [
  { value: 'text', label: 'Texto libre' },
  { value: 'number', label: 'Numero' },
  { value: 'phone', label: 'Telefono' },
  { value: 'document', label: 'Documento de identidad' },
];

const APPROVAL_EVENT_OPTIONS: Array<{
  value: ApprovalEvent;
  label: string;
  defaultLabel: string;
  status: NonNullable<OperatorApprovalBranch['status']>;
}> = [
  { value: 'approved', label: 'Evento: Aprobado', defaultLabel: 'Aprobado', status: 'accepted' as const },
  { value: 'rejected', label: 'Evento: Rechazado', defaultLabel: 'Rechazado', status: 'rejected' as const },
  { value: 'needs_info', label: 'Evento: Corregir/Info', defaultLabel: 'Corregir', status: 'pending' as const },
];

export function NodePropertiesPanel({ node, onUpdate, onClose }: NodePropertiesPanelProps) {
  const { settings } = useSettings();
  const data = node.data as Record<string, unknown>;

  const flowVariables = settings?.flow_variables ?? ([] as FlowVariable[]);

  const set = (key: string, value: unknown) => {
    onUpdate(node.id, { ...data, [key]: value });
  };

  const addOption = () => {
    const options = (data.options as MenuOption[] | undefined) ?? [];
    set('options', [...options, { id: `opt-${Date.now()}`, label: '' }]);
  };

  const updateOption = (idx: number, label: string) => {
    const options = [...((data.options as MenuOption[]) ?? [])];
    options[idx] = { ...options[idx], label };
    set('options', options);
  };

  const removeOption = (idx: number) => {
    const options = ((data.options as MenuOption[]) ?? []).filter((_, i) => i !== idx);
    set('options', options);
  };

  const addBranch = () => {
    const branches = (data.branches as ConditionBranch[] | undefined) ?? [];
    set('branches', [...branches, { id: `branch-${Date.now()}`, value: '' }]);
  };

  const updateBranch = (idx: number, value: string) => {
    const branches = [...((data.branches as ConditionBranch[]) ?? [])];
    branches[idx] = { ...branches[idx], value };
    set('branches', branches);
  };

  const removeBranch = (idx: number) => {
    const branches = ((data.branches as ConditionBranch[]) ?? []).filter((_, i) => i !== idx);
    set('branches', branches);
  };

  const getApprovalBranches = (): OperatorApprovalBranch[] => {
    const current = data.branches as OperatorApprovalBranch[] | undefined;
    if (current?.length) return current;

    const legacyBranches: OperatorApprovalBranch[] = [];
    if (data.acceptBranchId as string | undefined) {
      legacyBranches.push({
        id: data.acceptBranchId as string,
        event: 'approved',
        label: 'Aprobado',
        status: 'accepted',
      });
    }
    if (data.rejectBranchId as string | undefined) {
      legacyBranches.push({
        id: data.rejectBranchId as string,
        event: 'rejected',
        label: 'Rechazado',
        status: 'rejected',
      });
    }

    return legacyBranches;
  };

  const setApprovalBranches = (branches: OperatorApprovalBranch[]) => {
    onUpdate(node.id, { ...data, branches });
  };

  const addApprovalBranch = () => {
    const branches = getApprovalBranches();
    const usedEvents = new Set(branches.map((branch) => branch.event));
    const nextOption = APPROVAL_EVENT_OPTIONS.find((option) => !usedEvents.has(option.value));
    if (!nextOption) return;

    setApprovalBranches([
      ...branches,
      {
        id: `approval-${Date.now()}`,
        event: nextOption.value,
        label: nextOption.defaultLabel,
        status: nextOption.status,
      },
    ]);
  };

  const updateApprovalBranch = (
    idx: number,
    key: keyof OperatorApprovalBranch,
    value: OperatorApprovalBranch[keyof OperatorApprovalBranch],
  ) => {
    const branches = [...getApprovalBranches()];
    const nextBranch: OperatorApprovalBranch = { ...branches[idx], [key]: value } as OperatorApprovalBranch;

    if (key === 'event') {
      const eventOption = APPROVAL_EVENT_OPTIONS.find((option) => option.value === value);
      if (eventOption) {
        nextBranch.status = eventOption.status;
        if (!nextBranch.label.trim() || nextBranch.label === branches[idx].label) {
          nextBranch.label = eventOption.defaultLabel;
        }
      }
    }

    branches[idx] = nextBranch;
    setApprovalBranches(branches);
  };

  const removeApprovalBranch = (idx: number) => {
    setApprovalBranches(getApprovalBranches().filter((_, i) => i !== idx));
  };

  const approvalBranches = getApprovalBranches();
  const usedApprovalEvents = new Set(approvalBranches.map((branch) => branch.event));

  return (
    <aside className="flow-props">
      <div className="flow-props__header">
        <span className="flow-props__title">Propiedades</span>
        <button className="btn-icon" onClick={onClose} title="Cerrar">
          <X size={14} />
        </button>
      </div>

      <div className="flow-props__body">
        {(node.type === 'message' || node.type === 'operator') && (
          <div className="s-field">
            <label className="s-label">Mensaje</label>
            <textarea
              className="s-textarea"
              rows={4}
              value={(data.message as string) ?? ''}
              onChange={(e) => set('message', e.target.value)}
              placeholder="Escribe el mensaje del bot..."
            />
          </div>
        )}

        {node.type === 'media' && (
          <>
            <div className="s-field">
              <label className="s-label">Origen de la imagen</label>
              <select
                className="s-input"
                value={(data.source as string) ?? 'approval_upload'}
                onChange={(e) => set('source', e.target.value)}
              >
                <option value="approval_upload">Imagen subida por el operador</option>
              </select>
            </div>
            <div className="s-field">
              <label className="s-label">Caption</label>
              <textarea
                className="s-textarea"
                rows={3}
                value={(data.caption as string) ?? ''}
                onChange={(e) => set('caption', e.target.value)}
                placeholder="Texto opcional junto a la imagen"
              />
            </div>
            <div className="s-field">
              <label className="s-label">Mensaje si no hay imagen</label>
              <textarea
                className="s-textarea"
                rows={2}
                value={(data.fallbackMessage as string) ?? ''}
                onChange={(e) => set('fallbackMessage', e.target.value)}
                placeholder="Texto opcional cuando no se adjunta imagen"
              />
            </div>
          </>
        )}

        {node.type === 'event' && (
          <>
            <div className="s-field">
              <label className="s-label">Tipo de evento</label>
              <select
                className="s-select"
                value={(data.eventType as string) ?? 'max_fails'}
                onChange={(e) => set('eventType', e.target.value)}
              >
                <option value="max_fails">Maximo de fallos</option>
                <option value="timeout">Timeout de inactividad</option>
              </select>
            </div>
            {data.eventType === 'max_fails' && (
              <div className="s-field">
                <label className="s-label">Umbral de fallos</label>
                <input
                  className="s-input"
                  type="number"
                  min={1}
                  max={10}
                  value={(data.maxFails as number) ?? 3}
                  onChange={(e) => set('maxFails', parseInt(e.target.value, 10) || 3)}
                />
                <span className="s-hint">Cantidad de errores antes de activar este evento.</span>
              </div>
            )}
          </>
        )}

        {node.type === 'question' && (
          <>
            <div className="s-field">
              <label className="s-label">Mensaje de solicitud</label>
              <textarea
                className="s-textarea"
                rows={3}
                value={(data.message as string) ?? ''}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Que le preguntas al usuario?"
              />
            </div>
            <div className="s-field">
              <label className="s-label">Guardar respuesta en</label>
              <select
                className="s-input"
                value={(data.variable as string) ?? ''}
                onChange={(e) => set('variable', e.target.value)}
              >
                <option value="">Selecciona variable</option>
                {flowVariables.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="s-field">
              <label className="s-label">Tipo de validacion</label>
              <select
                className="s-input"
                value={(data.validation as string) ?? 'text'}
                onChange={(e) => set('validation', e.target.value)}
              >
                {VALIDATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {(node.type === 'menu' || node.type === 'buttons') && (
          <>
            <div className="s-field">
              <label className="s-label">
                {node.type === 'buttons' ? 'Texto del mensaje' : 'Titulo del menu'}
              </label>
              <input
                className="s-input"
                type="text"
                value={(data.title as string) ?? ''}
                onChange={(e) => set('title', e.target.value)}
                placeholder={
                  node.type === 'buttons'
                    ? 'Autorizas el tratamiento de datos?'
                    : 'Cual es tu EPS?'
                }
              />
              {node.type === 'buttons' && (
                <span className="s-hint">WhatsApp permite maximo 3 botones.</span>
              )}
            </div>
            <div className="s-field">
              <label className="s-label">Guardar respuesta en</label>
              <select
                className="s-input"
                value={(data.variable as string) ?? ''}
                onChange={(e) => set('variable', e.target.value)}
              >
                <option value="">No guardar, solo navegar</option>
                {flowVariables.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="s-field">
              <label className="s-label">Opciones</label>
              {((data.options as MenuOption[]) ?? []).map((option, index) => (
                <div key={option.id} className="s-add-row" style={{ marginBottom: 6 }}>
                  <input
                    className="s-input"
                    type="text"
                    value={option.label}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opcion ${index + 1}`}
                  />
                  <button className="btn-icon btn-icon--danger" onClick={() => removeOption(index)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {(node.type !== 'buttons' || ((data.options as MenuOption[]) ?? []).length < 3) && (
                <button className="btn btn--outline" onClick={addOption}>
                  <Plus size={13} /> Agregar opcion
                </button>
              )}
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <>
            <div className="s-field">
              <label className="s-label">Variable a evaluar</label>
              <select
                className="s-input"
                value={(data.variable as string) ?? ''}
                onChange={(e) => set('variable', e.target.value)}
              >
                <option value="">Selecciona variable</option>
                {flowVariables.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="s-field">
              <label className="s-label">Ramas</label>
              {((data.branches as ConditionBranch[]) ?? []).map((branch, index) => (
                <div key={branch.id} className="s-add-row" style={{ marginBottom: 6 }}>
                  <input
                    className="s-input"
                    type="text"
                    value={branch.value}
                    onChange={(e) => updateBranch(index, e.target.value)}
                    placeholder={`Valor esperado ${index + 1}`}
                  />
                  <button className="btn-icon btn-icon--danger" onClick={() => removeBranch(index)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <button className="btn btn--outline" onClick={addBranch}>
                <Plus size={13} /> Agregar rama
              </button>
            </div>
          </>
        )}

        {node.type === 'operator_approval' && (
          <>
            <div className="s-field">
              <label className="s-label">Mensaje para el usuario</label>
              <textarea
                className="s-textarea"
                rows={3}
                value={(data.message as string) ?? ''}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Esperando aprobacion..."
              />
            </div>
            <div className="s-field">
              <label className="s-label">Ramas de Decisión</label>
              {approvalBranches.map((branch, index) => (
                <div key={branch.id} className="s-add-row" style={{ marginBottom: 8, flexDirection: 'column', alignItems: 'stretch', border: '1px solid #eee', padding: '8px', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    <input
                      className="s-input"
                      type="text"
                      value={branch.label}
                      onChange={(e) => updateApprovalBranch(index, 'label', e.target.value)}
                      placeholder="Etiqueta (ej: Aprobado)"
                    />
                    <button className="btn-icon btn-icon--danger" onClick={() => removeApprovalBranch(index)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <select
                      className="s-select"
                      style={{ flex: 1 }}
                      value={branch.event}
                      onChange={(e) => updateApprovalBranch(index, 'event', e.target.value as ApprovalEvent)}
                    >
                      {APPROVAL_EVENT_OPTIONS.map((option) => {
                        const isUsedByAnotherBranch = option.value !== branch.event && usedApprovalEvents.has(option.value);
                        return (
                          <option key={option.value} value={option.value} disabled={isUsedByAnotherBranch}>
                            {option.label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              ))}
              <button
                className="btn btn--outline"
                onClick={addApprovalBranch}
                disabled={approvalBranches.length >= APPROVAL_EVENT_OPTIONS.length}
              >
                <Plus size={13} /> Agregar Rama
              </button>
            </div>
          </>
        )}

        {node.type === 'end' && (
          <>
            <div className="s-field">
              <label className="s-label">Accion de cierre</label>
              <select
                className="s-input"
                value={(data.action as string) ?? 'none'}
                onChange={(e) => set('action', e.target.value)}
              >
                <option value="none">Ninguna, solo finalizar</option>
                <option value="confirm">Confirmar cita y cambiar estado</option>
                <option value="cancel">Cancelar cita y cambiar estado</option>
              </select>
              <span className="s-hint">
                Util si este fin ocurre despues de que el usuario aprueba o rechaza asistir.
              </span>
            </div>
            <div className="s-field">
              <label className="s-label">Mensaje final</label>
              <textarea
                className="s-textarea"
                rows={3}
                value={(data.message as string) ?? ''}
                onChange={(e) => set('message', e.target.value)}
                placeholder="Registro completado"
              />
            </div>
          </>
        )}

        {node.type === 'start' && (
          <p className="s-hint">El nodo de inicio no tiene propiedades configurables.</p>
        )}
      </div>
    </aside>
  );
}
