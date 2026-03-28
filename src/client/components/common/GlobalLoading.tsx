import React from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export function GlobalLoading() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isWorking = isFetching > 0 || isMutating > 0;

  if (!isWorking) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-blue-500 animate-pulse transition-all duration-300 ease-in-out" style={{ width: '100%' }}></div>
    </div>
  );
}
