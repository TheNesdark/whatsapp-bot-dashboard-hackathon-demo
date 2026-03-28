import React from 'react';
import ReactDOM from 'react-dom';
import type { BaseModalProps } from '@/types';

export function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconClass = 'modal-icon--default',
  children,
  footer,
}: BaseModalProps) {
  if (!isOpen) return null;

  const content = (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          {icon && <div className={`modal-icon ${iconClass}`}>{icon}</div>}
          <div>
            <p className="modal-title">{title}</p>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
