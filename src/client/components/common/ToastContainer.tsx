import React from 'react';
import { useToastStore } from '@/store/toastStore';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
        >
          <span className="toast-icon">
            {toast.type === 'success' && <CheckCircle color="var(--success)" size={20} />}
            {toast.type === 'error' && <AlertCircle color="var(--danger)" size={20} />}
            {toast.type === 'info' && <Info color="var(--accent)" size={20} />}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="toast-close"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
