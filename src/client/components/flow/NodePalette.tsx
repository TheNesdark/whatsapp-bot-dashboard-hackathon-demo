import React from 'react';
import {
  CheckCircle,
  GitBranch,
  Hand,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  LayoutList,
  List,
  MessageSquare,
  MousePointer2,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Undo2,
  Zap,
} from 'lucide-react';

const NODE_TYPES = [
  { type: 'message', label: 'Mensaje', description: 'Envia un texto simple al usuario', icon: <MessageSquare size={16} />, color: '#3b82f6' },
  { type: 'media', label: 'Media', description: 'Envia una imagen desde el flujo', icon: <ImageIcon size={16} />, color: '#2563eb' },
  { type: 'question', label: 'Pregunta', description: 'Solicita un dato del usuario', icon: <HelpCircle size={16} />, color: '#8b5cf6' },
  { type: 'menu', label: 'Menu', description: 'Presenta opciones en una lista', icon: <List size={16} />, color: '#f59e0b' },
  { type: 'buttons', label: 'Botones', description: 'Envia hasta 3 botones interactivos', icon: <LayoutList size={16} />, color: '#ec4899' },
  { type: 'condition', label: 'Condicion', description: 'Evalua una variable para definir el flujo', icon: <GitBranch size={16} />, color: '#06b6d4' },
  { type: 'end', label: 'Fin', description: 'Finaliza la conversacion', icon: <CheckCircle size={16} />, color: '#16a34a' },
  { type: 'operator', label: 'Operador', description: 'Transfiere a atencion humana', icon: <Headphones size={16} />, color: '#0f172a' },
  { type: 'operator_approval', label: 'Aprobacion', description: 'Espera accion del operador', icon: <ShieldCheck size={16} />, color: '#0f172a' },
  { type: 'event', label: 'Evento', description: 'Maneja errores o tiempos de espera', icon: <Zap size={16} />, color: '#dc2626' },
  { type: 'return', label: 'Regresar', description: 'Vuelve a un paso anterior', icon: <RotateCcw size={16} />, color: '#64748b' },
];

import type { NodePaletteProps } from '@/types';

export function NodePalette({
  interactionMode,
  onToggleMode,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: NodePaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="flow-palette">
      <button
        className={`flow-palette__mode-btn ${interactionMode === 'select' ? 'flow-palette__mode-btn--active' : ''}`}
        onClick={onToggleMode}
        data-tooltip={interactionMode === 'pan' ? 'Modo seleccion' : 'Modo arrastrar'}
      >
        {interactionMode === 'pan' ? <MousePointer2 size={16} /> : <Hand size={16} />}
      </button>
      <div className="flow-palette__divider" />
      <div className="flow-palette__actions">
        <button
          className="flow-palette__action-btn"
          onClick={onUndo}
          disabled={!canUndo}
          data-tooltip="Deshacer (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          className="flow-palette__action-btn"
          onClick={onRedo}
          disabled={!canRedo}
          data-tooltip="Rehacer (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </button>
      </div>
      <div className="flow-palette__divider" />
      <div className="flow-palette__list">
        {NODE_TYPES.map(({ type, label, description, icon, color }) => (
          <div
            key={type}
            className="flow-palette__item"
            draggable
            onDragStart={(event) => onDragStart(event, type)}
            title={`${label}: ${description}`}
          >
            <span className="flow-palette__icon" style={{ color }}>
              {icon}
            </span>
            <span className="flow-palette__label">{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
