import { create } from 'zustand';
import type { HelpRequest } from '@/types';

interface HelpRequestState {
  requests: HelpRequest[];
  setRequests: (requests: HelpRequest[]) => void;
  addRequest: (request: HelpRequest) => void;
  removeRequest: (id: number) => void;
}

export const useHelpRequestStore = create<HelpRequestState>((set) => ({
  requests: [],
  setRequests: (requests) => set({ requests }),
  addRequest: (request) => set((state) => ({ 
    requests: [request, ...state.requests] 
  })),
  removeRequest: (id) => set((state) => ({ 
    requests: state.requests.filter(r => r.id !== id)
  })),
}));
