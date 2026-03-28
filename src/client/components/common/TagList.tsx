import React from 'react';
import { XCircle } from 'lucide-react';

import type { TagListProps } from '@/types';

export function TagList({ items, onRemove }: TagListProps) {
  return (
    <div className="s-tag-list">
      {items.map((item, i) => (
        <span key={item} className="s-tag">
          {item}
          <button
            className="s-tag-remove"
            onClick={() => onRemove(i)}
            title="Eliminar"
            type="button"
          >
            <XCircle size={13} />
          </button>
        </span>
      ))}
    </div>
  );
}
