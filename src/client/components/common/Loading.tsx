import React from 'react';

import type { LoadingProps } from '@/types';

export function Loading({ text = 'Cargando...', size = 'md' }: LoadingProps) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`${sizeClass} border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin`} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  );
}
