import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ToastContainer } from './components/common';
import { useToastStore } from './store/toastStore';
import App from './App.tsx';
import './styles/index.css';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      useToastStore.getState().addToast(error.message || 'Error loading data', 'error');
    },
  }),
  mutationCache: new MutationCache({}),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastContainer />
    </QueryClientProvider>
  </StrictMode>,
);
