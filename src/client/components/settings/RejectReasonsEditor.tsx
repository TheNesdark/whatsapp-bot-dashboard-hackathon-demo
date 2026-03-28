import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { parseJsonArray } from '@/utils';
import type { RejectReasonsEditorProps } from '@/types';

export function RejectReasonsEditor({ value, onChange }: RejectReasonsEditorProps) {
  const reasons = parseJsonArray(value);
  const [newReason, setNewReason] = useState('');

  const addReason = () => {
    const trimmed = newReason.trim();
    if (!trimmed) return;

    onChange(JSON.stringify([...reasons, trimmed]));
    setNewReason('');
  };

  const removeReason = (index: number) => {
    onChange(JSON.stringify(reasons.filter((_, currentIndex) => currentIndex !== index)));
  };

  const updateReason = (index: number, nextValue: string) => {
    onChange(JSON.stringify(reasons.map((reason, currentIndex) => (currentIndex === index ? nextValue : reason))));
  };

  return (
    <>
      <div className="s-reject-list">
        {reasons.length === 0 && (
          <span className="s-hint">No hay motivos configurados. Anade algunos para que los operadores puedan seleccionarlos al rechazar.</span>
        )}
        {reasons.map((reason, index) => (
          <div key={index} className="s-reject-item">
            <input
              className="s-input"
              value={reason}
              onChange={(event) => updateReason(index, event.target.value)}
              placeholder="Motivo de rechazo"
            />
            <button className="btn-icon btn-icon--danger" type="button" onClick={() => removeReason(index)} title="Eliminar">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <div className="s-add-row" style={{ marginTop: 8 }}>
        <input
          className="s-input"
          placeholder="Nuevo motivo de rechazo"
          value={newReason}
          onChange={(event) => setNewReason(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addReason())}
          maxLength={200}
        />
        <button className="btn btn--secondary s-add-btn" type="button" onClick={addReason} disabled={!newReason.trim()}>
          <Plus size={14} /> Anadir
        </button>
      </div>
    </>
  );
}
