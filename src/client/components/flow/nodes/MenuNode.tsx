import React, { useRef, useState, useLayoutEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { List } from 'lucide-react';
import type { MenuNodeData } from '@shared/flow';
import type { FlowNodeProps } from '@/types';

export function MenuNode({ data, selected }: FlowNodeProps<MenuNodeData>) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [tops, setTops] = useState<number[]>([]);

  useLayoutEffect(() => {
    if (!nodeRef.current) return;

    const newTops = rowRefs.current.map((el) => {
      if (!el) return 0;
      // Use offsetTop relative to the node (which has position: relative)
      // offsetTop already accounts for padding since it's relative to the padding edge
      return el.offsetTop + el.offsetHeight / 2;
    });
    setTops(newTops);
  }, [data.options]);

  const options = data.options ?? [];

  return (
    <div
      ref={nodeRef}
      className={`flow-node flow-node--menu${selected ? ' flow-node--selected' : ''}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flow-node__header">
        <List size={12} />
        <span>Menú</span>
      </div>
      <div className="flow-node__body">
        <p className="flow-node__preview">{data.title || <em>Sin título</em>}</p>
        <div className="flow-node__options">
          {options.map((opt, i) => (
            <div
              key={opt.id}
              ref={(el) => { rowRefs.current[i] = el; }}
              className="flow-node__option flow-node__option--handle-row"
            >
              <span className="flow-node__option-num">{i + 1}</span>
              <span className="flow-node__option-label">{opt.label}</span>
              <span className="flow-node__option-dot" />
            </div>
          ))}
        </div>
      </div>
      {options.map((opt, i) => (
        <Handle
          key={opt.id}
          type="source"
          position={Position.Right}
          id={opt.id}
          style={tops[i] !== undefined ? { top: tops[i] } : undefined}
        />
      ))}
    </div>
  );
}
