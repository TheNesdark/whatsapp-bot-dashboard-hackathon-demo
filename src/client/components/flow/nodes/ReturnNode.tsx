import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { RotateCcw } from 'lucide-react';
import type { ReturnNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

export function ReturnNode({ data, selected }: FlowNodeProps<ReturnNodeData>) {
    return (
        <div className={`flow-node flow-node--return${selected ? ' flow-node--selected' : ''}`}>
            <Handle type="target" position={Position.Top} />
            <div className="flow-node__header">
                <RotateCcw size={12} />
                <span>Regresar</span>
            </div>
            <div className="flow-node__body">
                <p className="flow-node__preview">Vuelve al paso anterior al error</p>
            </div>
        </div>
    );
}
