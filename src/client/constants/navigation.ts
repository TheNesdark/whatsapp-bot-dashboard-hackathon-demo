import { BarChart2, GitBranch, LayoutDashboard, MessageCircle, Settings, Smartphone } from 'lucide-react';

export const SIDEBAR_NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/instances', icon: Smartphone, label: 'Instancias' },
  { path: '/flow', icon: GitBranch, label: 'Flow' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/reports', icon: BarChart2, label: 'Reportes' },
  { path: '/settings', icon: Settings, label: 'Ajustes' },
] as const;
