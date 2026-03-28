import { create } from 'zustand';
import type { UiState } from '@/types';

export const useUiStore = create<UiState>((set) => ({
  agentName: '',
  setAgentName: (name: string) => set({ agentName: name }),
}));
