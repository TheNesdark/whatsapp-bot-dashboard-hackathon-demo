import React, { useRef, useState, useLayoutEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import type { ConditionNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

const VARIABLE_LABELS: Record<string, string> = {
  name: 'Nombre',
  cedula: 'Codigo o Referencia',
  phone: 'Contacto',
  address: 'Equipo o Ciudad',
  eps: 'Categoria',
  appointmentType: 'Tipo de Solicitud',
};

export function ConditionNode({ data, selected }: FlowNodeProps<ConditionNodeData>) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const defaultRowRef = useRef<HTMLDivElement | null>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [tops, setTops] = useState<number[]>([]);
  const [defaultTop, setDefaultTop] = useState<number>(0);

  const branches = data.branches ?? [];

  useLayoutEffect(() => {
    if (!nodeRef.current) return;

    const newTops = rowRefs.current.map((el) => {
      if (!el) return 0;
      return el.offsetTop + el.offsetHeight / 2;
    });
    setTops(newTops);

    if (defaultRowRef.current) {
      setDefaultTop(defaultRowRef.current.offsetTop + defaultRowRef.current.offsetHeight / 2);
    }
  }, [data.branches, data.defaultBranchId]);

  return (
    <div ref={nodeRef} className={`flow-node flow-node--condition${selected ? ' flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__header">
        <GitBranch size={12} />
        <span>Condicion</span>
      </div>
      <div className="flow-node__body">
        <span className="flow-node__badge">
          {data.variable ? VARIABLE_LABELS[data.variable] ?? data.variable : 'Sin variable'}
        </span>
        <div className="flow-node__options">
          {branches.map((branch, i) => (
            <div
              key={branch.id}
              ref={(el) => { rowRefs.current[i] = el; }}
              className="flow-node__option flow-node__option--handle-row"
            >
              <span className="flow-node__option-label">{branch.value || `Rama ${i + 1}`}</span>
              <span className="flow-node__option-dot" />
            </div>
          ))}
          {data.defaultBranchId && (
            <div
              ref={defaultRowRef}
              className="flow-node__option flow-node__option--handle-row"
            >
              <span className="flow-node__option-label flow-node__option-label--default">Por defecto</span>
              <span className="flow-node__option-dot" />
            </div>
          )}
        </div>
      </div>
      {branches.map((branch, i) => (
        <Handle
          key={branch.id}
          type="source"
          position={Position.Right}
          id={branch.id}
          style={tops[i] !== undefined ? { top: tops[i] } : undefined}
        />
      ))}
      {data.defaultBranchId && (
        <Handle
          type="source"
          position={Position.Right}
          id={data.defaultBranchId}
          style={defaultTop ? { top: defaultTop } : undefined}
        />
      )}
    </div>
  );
}
