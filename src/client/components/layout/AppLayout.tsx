import React from 'react';
import { GlobalLoading } from '@/components/common';
import { HelpNotification } from '@/components/help';
import { useHelpRequests } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import type { AppLayoutProps } from '@/types';

export function AppLayout({ children, sidebar }: AppLayoutProps) {
  const { requests } = useHelpRequests();
  const navigate = useNavigate();

  return (
    <div className="app-layout">
      <GlobalLoading />
      {sidebar}
      <main className="main-scroll">{children}</main>

      {/* Notificación de ayuda */}
      <HelpNotification
        requests={requests}
        onClick={() => navigate('/chat')}
      />
    </div>
  );
}
