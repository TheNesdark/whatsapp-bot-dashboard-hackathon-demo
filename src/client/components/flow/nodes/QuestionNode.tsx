import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';
import type { QuestionNodeData } from '@shared/flow';
import type { FlowVariable } from '@shared/settings';
import { useSettings } from '@/hooks';
import type { FlowNodeProps } from '@/types';

export function QuestionNode({ data, selected }: FlowNodeProps<QuestionNodeData>) {
  const { settings } = useSettings();
  const flowVariables = settings?.flow_variables ?? ([] as FlowVariable[]);
  const variable = flowVariables.find(v => v.id === data.variable);

  return (
    <div className={`flow-node flow-node--question${selected ? ' flow-node--selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__header">
        <HelpCircle size={12} />
        <span>Pregunta</span>
      </div>
      <div className="flow-node__body">
        <p className="flow-node__preview">{data.message || <em>Sin mensaje</em>}</p>
        {data.variable && (
          <span className="flow-node__badge">→ {variable?.label ?? data.variable}</span>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
