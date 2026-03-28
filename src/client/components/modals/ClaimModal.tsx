import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { BaseModal } from './BaseModal';
import type { ClaimModalProps } from '@/types';

export function ClaimModal({ isOpen, operators, onConfirm, onClose }: ClaimModalProps) {
  const [selected, setSelected] = useState('');

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setSelected('');
  };

  const handleClose = () => {
    setSelected('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tomar registro"
      subtitle="Selecciona el operador que atenderá este registro."
      icon={<UserCheck size={18} />}
      iconClass="modal-icon--accept"
      footer={
        <>
          <button className="btn btn--ghost" onClick={handleClose}>Cancelar</button>
          <button className="btn btn--primary" onClick={handleConfirm} disabled={!selected}>
            Confirmar
          </button>
        </>
      }
    >
      {operators.length === 0 ? (
        <p className="modal-empty-hint">
          No hay operadores configurados. Ve a <strong>Configuración → Operadores</strong> para añadir uno.
        </p>
      ) : (
        <select
          className="modal-select"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          autoFocus
        >
          <option value="">— Selecciona un operador —</option>
          {operators.map(op => (
            <option key={op.id} value={op.name}>{op.name}</option>
          ))}
        </select>
      )}
    </BaseModal>
  );
}
