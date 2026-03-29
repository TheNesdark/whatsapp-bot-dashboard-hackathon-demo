import React from 'react';
import { Clock, Users, CheckCheck, WifiOff } from 'lucide-react';
import { StatCard } from '@/components/common';
import { RegistrationTable } from '@/components/dashboard';
import { RejectModal, AcceptModal } from '@/components/modals';
import { useDashboardPage, useSettings } from '@/hooks';

export default function Dashboard() {
  const { settings } = useSettings();
  const {
    stats,
    areaList,
    agentName,
    refetch,
    rejectReasons,
    acceptReasons,
    filteredRegistrations,
    regSearch,
    setRegSearch,
    regStatusFilter,
    setRegStatusFilter,
    regAreaFilter,
    setRegAreaFilter,
    rejectTarget,
    setRejectTarget,
    acceptTarget,
    setAcceptTarget,
    handleAttend,
    handleRelease,
  } = useDashboardPage();

  const onApproveAction = (id: number, phone: string, event?: string) => {
    setAcceptTarget({ id, phone, event });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Gestión de registros.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total" value={stats.total} icon={<Users size={18} />} iconClass="stat-icon--default" />
        <StatCard label="Pendientes" value={stats.pending} icon={<Clock size={18} />} iconClass="stat-icon--amber" />
        <StatCard label="Aceptados" value={stats.accepted} icon={<CheckCheck size={18} />} iconClass="stat-icon--green" />
        <StatCard label="Rechazados" value={stats.rejected} icon={<WifiOff size={18} />} iconClass="stat-icon--red" />
      </div>

      <RegistrationTable
        registrations={filteredRegistrations}
        search={regSearch}
        onSearchChange={setRegSearch}
        statusFilter={regStatusFilter}
        onStatusFilterChange={setRegStatusFilter}
        areaFilter={regAreaFilter}
        onAreaFilterChange={setRegAreaFilter}
        areaList={areaList}
        onAccept={(id, phone) => onApproveAction(id, phone, 'approved')}
        onReject={(id, phone) => setRejectTarget({ id, phone })}
        onApprove={(id, phone, _, event) => onApproveAction(id, phone, event)}
        onDeny={(id, phone) => setRejectTarget({ id, phone })}
        onAttend={handleAttend}
        onRelease={handleRelease}
        agentName={agentName}
        flowVariables={(settings?.flow_variables as any[]) ?? []}
      />

      <RejectModal
        isOpen={!!rejectTarget}
        id={rejectTarget?.id ?? 0}
        phone={rejectTarget?.phone ?? ''}
        reasons={rejectReasons}
        agentName={agentName}
        onClose={() => setRejectTarget(null)}
        onSuccess={refetch}
      />

      <AcceptModal
        isOpen={!!acceptTarget}
        id={acceptTarget?.id ?? 0}
        phone={acceptTarget?.phone ?? ''}
        reasons={acceptReasons}
        event={acceptTarget?.event}
        agentName={agentName}
        onClose={() => setAcceptTarget(null)}
        onSuccess={refetch}
      />
    </div>
  );
}
