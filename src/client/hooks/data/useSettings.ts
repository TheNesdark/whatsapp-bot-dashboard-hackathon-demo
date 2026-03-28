import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, saveSettings as saveSettingsRequest } from '@/services';
import { resetWs, useWsEvent } from '@/hooks/realtime/useWsEvent';
import { useToastStore } from '@/store/toastStore';
import type { SettingsState } from '@/types';
import { savePassword } from '@/utils/api';

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['settingsData'],
    queryFn: getSettings,
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: SettingsState) => {
      const response = await saveSettingsRequest(newSettings);
      if (!response.ok) throw new Error('Error al guardar');

      if (newSettings.dashboard_password_enabled && newSettings.dashboard_password) {
        savePassword(newSettings.dashboard_password);
        resetWs();
      }

      return newSettings;
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(['settingsData'], newSettings);
      useToastStore.getState().addToast('Configuracion guardada correctamente', 'success');
    },
    onError: () => {
      useToastStore.getState().addToast('Error al guardar configuracion', 'error');
    },
  });

  useWsEvent('settings:changed', () => {
    queryClient.invalidateQueries({ queryKey: ['settingsData'] });
  });

  return {
    settings: query.data,
    loading: query.isLoading,
    saving: mutation.isPending,
    saveSettings: mutation.mutateAsync,
  };
}
