import React from 'react';

import type { StatCardProps } from '@/types';

export function StatCard({ label, value, icon, iconClass = 'stat-icon--default' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
      <div className={`stat-icon ${iconClass}`}>
        {icon}
      </div>
    </div>
  );
}
