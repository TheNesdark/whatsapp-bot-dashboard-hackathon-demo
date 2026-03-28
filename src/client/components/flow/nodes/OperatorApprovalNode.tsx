import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldCheck } from 'lucide-react';
import type { OperatorApprovalNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

export function OperatorApprovalNode({ data, selected }: FlowNodeProps<OperatorApprovalNodeData>) {
    const branches = data.branches?.length ? data.branches : [
        { id: 'opt-accept', label: 'Aprobado', event: 'approved' },
        { id: 'opt-reject', label: 'Rechazado', event: 'rejected' },
        { id: 'opt-retry', label: 'Corregir', event: 'needs_info' },
    ];

    const getBranchColor = (event: string) => {
        if (event === 'approved') return 'branch-tag--green';
        if (event === 'rejected') return 'branch-tag--red';
        if (event === 'needs_info') return 'branch-tag--yellow';
        return '';
    };

    return (
        <div className={`flow-node flow-node--operator-approval${selected ? ' flow-node--selected' : ''}`}>
            <Handle type="target" position={Position.Top} />
            <div className="flow-node__header" style={{ backgroundColor: '#6366f1', color: 'white' }}>
                <ShieldCheck size={12} />
                <span>Decisión de Operador</span>
            </div>
            <div className="flow-node__body">
                <p className="flow-node__preview">{data.message || <em>Esperando revisión...</em>}</p>
                <div className="flow-node__branches-preview" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {branches.map(b => (
                        <span key={b.id} className={`branch-tag ${getBranchColor(b.event)}`}>
                            {b.label}
                        </span>
                    ))}
                </div>
            </div>
            {branches.map((branch, index) => (
                <Handle
                    key={branch.id}
                    type="source"
                    position={Position.Bottom}
                    id={branch.id}
                    style={{ 
                        left: `${((index + 1) * 100) / (branches.length + 1)}%`,
                        backgroundColor: branch.event === 'approved' ? '#22c55e' : branch.event === 'rejected' ? '#ef4444' : '#eab308'
                    }}
                />
            ))}
        </div>
    );
}
