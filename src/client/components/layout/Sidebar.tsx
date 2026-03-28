import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, UserCheck, Wifi, WifiOff } from 'lucide-react';
import { SIDEBAR_NAV_ITEMS } from '@/constants/navigation';
import { useOperators, useInstances, useHelpRequests, useDashboardData, isWsConnected } from '@/hooks';
import { useUiStore } from '@/store/uiStore';
import type { SidebarProps } from '@/types';

export function Sidebar({ siteName }: SidebarProps) {
  const location = useLocation();
  const { operators } = useOperators();
  const { instances } = useInstances();
  const { requests } = useHelpRequests();
  const { registrations } = useDashboardData();
  const agentName = useUiStore((state) => state.agentName);
  const setAgentName = useUiStore((state) => state.setAgentName);
  const [wsConnected, setWsConnected] = useState(() => isWsConnected());

  // Contar solicitudes pendientes
  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;
  const pendingRegistrationsCount = registrations.filter(r => r.status === 'pending').length;

  // Track WebSocket connection status via custom events
  useEffect(() => {
    const handleConnected = () => setWsConnected(true);
    const handleDisconnected = () => setWsConnected(false);

    window.addEventListener('ws:connected', handleConnected);
    window.addEventListener('ws:disconnected', handleDisconnected);

    // Check initial state
    setWsConnected(isWsConnected());

    return () => {
      window.removeEventListener('ws:connected', handleConnected);
      window.removeEventListener('ws:disconnected', handleDisconnected);
    };
  }, []);

  // Count active instances
  const activeInstances = instances.filter(i => i.isActive).length;
  const totalInstances = instances.length;

  // Cuando carguen los operadores, si el guardado ya no existe, limpiar
  useEffect(() => {
    if (operators.length === 0) return;
    const stillExists = operators.some(op => op.name === agentName);
    if (agentName && !stillExists) {
      setAgentName('');
    }
  }, [operators, agentName, setAgentName]);

  const handleOperatorChange = (name: string) => {
    setAgentName(name);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} />
        </div>
        <div>
          <p className="sidebar-logo-name">{siteName}</p>
          <p className="sidebar-logo-sub">Dashboard</p>
        </div>
      </div>

      <div className="sidebar-divider" />

      <nav className="sidebar-nav">
        {SIDEBAR_NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`nav-link${active ? ' nav-link--active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Icon size={16} className="nav-icon" />
                {label}
              </div>
              {(path === '/chat' && pendingRequestsCount > 0) || (path === '/' && pendingRegistrationsCount > 0) ? (
                <span className="sidebar-badge">
                  {path === '/chat' ? pendingRequestsCount : pendingRegistrationsCount}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* ── Selector de operador ── */}
      <div className="sidebar-divider" />
      <div className="sidebar-operator">
        <div className="sidebar-operator-label">
          <UserCheck size={12} />
          Operador activo
        </div>
        {operators.length === 0 ? (
          <span className="sidebar-operator-empty">Sin operadores</span>
        ) : (
          <select
            className="sidebar-operator-select"
            value={agentName}
            onChange={e => handleOperatorChange(e.target.value)}
          >
            <option value="">— Seleccionar —</option>
            {operators.map(op => (
              <option key={op.id} value={op.name}>{op.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="sidebar-footer">
        {/* Server Status */}
        <div className="server-status">
          <span className={`server-status-dot ${wsConnected ? 'server-status-dot--connected' : 'server-status-dot--disconnected'}`}>
            {wsConnected ? (
              <>
                <span className="server-status-dot-ping" />
                <span className="server-status-dot-inner" />
              </>
            ) : (
              <span className="server-status-dot-inner" />
            )}
          </span>
          <span className="server-status-label">
            {wsConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Instances Status */}
        <div className="server-status">
          {activeInstances > 0 ? (
            <Wifi size={12} className="server-status-icon server-status-icon--connected" />
          ) : (
            <WifiOff size={12} className="server-status-icon server-status-icon--disconnected" />
          )}
          <span className="server-status-label">
            {totalInstances === 0
              ? 'Sin instancias'
              : `${activeInstances}/${totalInstances} instancia${totalInstances !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
    </aside>
  );
}
