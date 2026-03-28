import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorDisplay({ message, onDismiss }: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
      <p className="text-red-800 font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 text-sm mt-2 underline"
        >
          Descartar
        </button>
      )}
    </div>
  );
}
