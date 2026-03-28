import { useMemo, useState } from 'react';
import { useDashboardData, useRegistrationFilters, useRegistrationStats, useSettings } from '@/hooks';
import { claimRegistration, releaseRegistration } from '@/services';
import { useUiStore } from '@/store/uiStore';
import { useToastStore } from '@/store/toastStore';
import type { ModalTarget } from '@/types';
import { parseJsonArray } from '@/utils';

export function useDashboardPage() {
  const { addToast } = useToastStore();
  const { registrations, refetch } = useDashboardData();
  const { settings } = useSettings();
  const { filterRegistrations, epsList } = useRegistrationFilters(registrations);
  const stats = useRegistrationStats(registrations);
  const agentName = useUiStore((state) => state.agentName);

  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState('all');
  const [regEpsFilter, setRegEpsFilter] = useState('all');
  const [rejectTarget, setRejectTarget] = useState<ModalTarget | null>(null);
  const [acceptTarget, setAcceptTarget] = useState<ModalTarget | null>(null);

  const handleAttend = async (id: number) => {
    if (!agentName) {
      addToast('Selecciona un operador en el panel lateral antes de reclamar un registro.', 'error');
      return;
    }

    await claimRegistration(id, agentName);
    refetch();
  };

  const handleRelease = async (id: number) => {
    await releaseRegistration(id);
    refetch();
  };

  const rejectReasons = useMemo(() => {
    return parseJsonArray(settings?.reject_reasons);
  }, [settings?.reject_reasons]);

  const acceptReasons = useMemo(() => {
    return parseJsonArray(settings?.accept_reasons);
  }, [settings?.accept_reasons]);

  const filteredRegistrations = filterRegistrations(regSearch, regStatusFilter, regEpsFilter);

  return {
    stats,
    epsList,
    agentName,
    refetch,
    rejectReasons,
    acceptReasons,
    filteredRegistrations,
    regSearch,
    setRegSearch,
    regStatusFilter,
    setRegStatusFilter,
    regEpsFilter,
    setRegEpsFilter,
    rejectTarget,
    setRejectTarget,
    acceptTarget,
    setAcceptTarget,
    handleAttend,
    handleRelease,
  };
}
