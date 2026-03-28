import React from 'react';

import type { SectionHeaderProps } from '@/types';

export function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="s-section-header">
      <div className="s-section-icon">{icon}</div>
      <div>
        <p className="s-section-title">{title}</p>
        {description && <p className="s-section-desc">{description}</p>}
      </div>
    </div>
  );
}
