import React, { useState } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { rejectRegistrationSchema } from '@/schemas/registrations';
import { BaseModal } from './BaseModal';
import { usePastedImageUpload, useRegistrationActions } from '@/hooks';
import type { RejectModalProps } from '@/types';

export function RejectModal({
  isOpen,
  id,
  phone,
  reasons,
  agentName,
  onClose,
  onSuccess,
}: RejectModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { rejectRegistration } = useRegistrationActions();
  const { image, preview, setImageFile, clearImage } = usePastedImageUpload(isOpen);

  const handleConfirm = async () => {
    if (loading) return;
    const result = rejectRegistrationSchema.safeParse({ reason });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Formulario invalido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rejectResult = await rejectRegistration(id, phone, result.data.reason || '', agentName, image);
      if (rejectResult.success) {
        onSuccess();
        onClose();
        setReason('');
        clearImage();
      } else {
        setError(rejectResult.error || 'Error al rechazar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setReason('');
    clearImage();
    setError('');
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rechazar cita"
      subtitle="El usuario sera notificado por WhatsApp."
      icon={<X size={18} />}
      iconClass="modal-icon--red"
      footer={
        <div className="flex gap-2 flex-col">
          {error && <p className="modal-error">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button className="btn btn--ghost" onClick={handleClose}>
              Cancelar
            </button>
            <button
              className="btn btn--danger"
              disabled={loading}
              onClick={handleConfirm}
            >
              {loading ? 'Enviando...' : 'Confirmar rechazo'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="block">
          <span className="upload-zone-label">Imagen de rechazo (opcional)</span>
          <label className="upload-zone" htmlFor="reject-image-input">
            {preview ? (
              <div className="upload-preview relative">
                <img src={preview} alt="Preview" />
                <button
                  type="button"
                  className="upload-remove-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    clearImage();
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="upload-zone-placeholder">
                <div className="upload-zone-icon-wrap">
                  <ImageIcon size={18} />
                </div>
                <p className="upload-zone-text">Click para seleccionar o pegue la imagen</p>
              </div>
            )}
            <input
              id="reject-image-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setImageFile(e.target.files[0]);
                }
              }}
              className="sr-only"
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div className="space-y-2">
          <span className="upload-zone-label">Motivo del rechazo</span>
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(reasons) ? reasons : [])
              .filter((r) => r && typeof r === 'string' && r.trim() !== '')
              .map((r) => (
                <button
                  key={r}
                  className={`reason-btn${reason === r ? ' reason-btn--selected' : ''}`}
                  onClick={() => setReason(r)}
                  type="button"
                >
                  {r}
                </button>
              ))}
          </div>
          <textarea
            className="reject-textarea"
            placeholder="O escribe un motivo personalizado..."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
    </BaseModal>
  );
}
