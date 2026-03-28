import { create } from 'zustand';
import type { ToastState } from '@/types';

const TOAST_DURATION = 3_000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID();
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), TOAST_DURATION);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
