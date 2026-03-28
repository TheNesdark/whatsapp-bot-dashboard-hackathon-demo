import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Plus, Trash2, Loader2, Smartphone } from 'lucide-react';
import type { WhatsAppInstance } from '@/types';
import { useCreateInstanceForm, useInstancesPage } from '@/hooks';

const InstanceCard: React.FC<{
  inst: WhatsAppInstance;
  onDelete: (id: number) => Promise<boolean>;
}> = ({ inst, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="inst-card">
      <div className="inst-card__header">
        <div className="inst-card__info">
          <div className="inst-card__icon"><Smartphone size={17} /></div>
          <div className="inst-card__text">
            <p className="inst-card__name">{inst.name}</p>
            {inst.phoneNumberId && <p className="inst-card__meta">ID {inst.phoneNumberId}</p>}
            {inst.apiUrl && <p className="inst-card__meta" style={{ fontSize: '0.75rem' }}>{inst.apiUrl}</p>}
          </div>
        </div>
        <div className="inst-card__actions">
          {confirmDelete ? (
            <>
              <button className="btn btn--danger" style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem' }} onClick={() => onDelete(inst.id)}>Confirmar</button>
              <button className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem' }} onClick={() => setConfirmDelete(false)}>Cancelar</button>
            </>
          ) : (
            <button className="btn-icon btn-icon--reject" title="Eliminar instancia" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: import('@/types').CreateInstanceInput) => Promise<unknown>;
}) {
  const { fields, loading, error, setField, handleSubmit } = useCreateInstanceForm(onCreate, onClose);
  const formFields: Array<{
    label: string;
    key: 'name' | 'phone' | 'apiUrl';
    ph: string;
    extra?: { maxLength?: number };
  }> = [
    { label: 'Nombre de la instancia', key: 'name', ph: 'Ej: Ventas, Soporte...', extra: { maxLength: 64 } },
    { label: 'ID de numero de WhatsApp', key: 'phone', ph: 'Ej: 1234567890' },
    { label: 'URL de la API (opcional)', key: 'apiUrl', ph: 'https://graph.facebook.com/v22.0' },
  ];

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
    >
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header"><p className="modal-title">Nueva instancia de WhatsApp</p></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {formFields.map(({ label, key, ph, extra }, index) => (
              <div key={key} style={index > 0 ? { marginTop: '1rem' } : undefined}>
                <p className="settings-label">{label}</p>
                <input
                  className="settings-input"
                  placeholder={ph}
                  value={fields[key]}
                  onChange={setField(key)}
                  disabled={loading}
                  {...extra}
                />
              </div>
            ))}
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Introduce el ID de numero provisto por Meta. El token de acceso se configura globalmente en Settings.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn--primary" disabled={loading || !fields.name.trim()}>
              {loading ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
              {loading ? 'Creando...' : 'Crear instancia'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function Instances() {
  const { instances, loading, error, createInstance, deleteInstance, showCreate, openCreateModal, closeCreateModal } = useInstancesPage();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Instancias de WhatsApp</h1>
          <p className="page-subtitle">Gestiona multiples numeros de WhatsApp conectados al bot.</p>
        </div>
        <button className="btn btn--primary" onClick={openCreateModal}>
          <Plus size={15} /> Nueva instancia
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg, #fee2e2)', color: 'var(--danger)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Error: {error}
        </div>
      )}

      {loading && instances.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="spin" />
        </div>
      ) : instances.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <p>No hay instancias registradas.</p>
          <p>Haz clic en <strong>Nueva instancia</strong> para agregar un numero de WhatsApp Business.</p>
        </div>
      ) : (
        <div className="inst-grid">
          {instances.map((instance) => (
            <InstanceCard key={instance.id} inst={instance} onDelete={deleteInstance} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={closeCreateModal}
          onCreate={(input) => createInstance(input.name, input.phoneNumberId, input.accessToken, input.apiUrl) as Promise<unknown>}
        />
      )}
    </div>
  );
}
