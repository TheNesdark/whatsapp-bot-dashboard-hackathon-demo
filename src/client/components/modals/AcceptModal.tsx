import React, { useState } from 'react';
import { CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { usePastedImageUpload, useRegistrationActions } from '@/hooks';
import { useToastStore } from '@/store/toastStore';
import type { AcceptModalProps } from '@/types';

export function AcceptModal({
  isOpen,
  id,
  phone,
  reasons,
  agentName,
  event,
  onClose,
  onSuccess,
}: AcceptModalProps) {    
  const { addToast } = useToastStore();  
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { acceptRegistration } = useRegistrationActions();
  const { image, preview, setImageFile, clearImage } = usePastedImageUpload(isOpen);

  const handleConfirm = async () => {
    if (loading) return; // Prevenir doble clic
    setLoading(true);
    try {
      const result = await acceptRegistration(id, phone, image, agentName, event, reason);
      if (result.success) {
        onSuccess();
        onClose();
        clearImage();
        setReason('');
      } else {
        addToast(`Error: ${result.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    clearImage();
    setReason('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Aceptar cita"
      subtitle="Puedes adjuntar una imagen y un mensaje opcional."
      icon={<CheckCircle2 size={18} />}
      iconClass="modal-icon--green"
      footer={
        <div className="flex gap-2 justify-end">
          <button className="btn btn--ghost" onClick={handleClose}>
            Cancelar
          </button>
          <button
            className="btn btn--success"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? 'Procesando...' : 'Aceptar cita'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="block">
          <span className="upload-zone-label">Imagen de confirmacion (opcional)</span>
          <label className="upload-zone" htmlFor="accept-image-input">
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
              id="accept-image-input"
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
          <span className="upload-zone-label">Mensaje o motivo (opcional)</span>
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
            placeholder="Escribe un mensaje personalizado..."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
    </BaseModal>
  );
}
