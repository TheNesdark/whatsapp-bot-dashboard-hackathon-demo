import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Zap } from 'lucide-react';
import type { EventNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

const EVENT_TYPE_LABELS: Record<string, string> = {
    max_fails: 'Máx. Fallos',
    timeout: 'Timeout',
};

export function EventNode({ data, selected }: FlowNodeProps<EventNodeData>) {
    return (
        <div
            className={`flow-node flow-node--event${selected ? ' flow-node--selected' : ''}`}
        >
            <div className="flow-node__header">
                <Zap size={12} />
                <span>Evento: {EVENT_TYPE_LABELS[data.eventType] || data.eventType}</span>
            </div>
            <div className="flow-node__body">
                {data.eventType === 'max_fails' && (
                    <div className="flow-node__meta">
                        <span className="flow-node__tag">Umbral: {data.maxFails ?? 3} fallos</span>
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
}
