import type { ReactNode } from 'react';
import type { Operator, Registration } from './registration';
import type { HelpRequest } from './help';
import type { FlowNode } from '@shared/flow';
import type { FlowVariable } from './settings';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconClass?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export interface AcceptModalProps {
  isOpen: boolean;
  id: number;
  phone: string;
  reasons: string[];
  agentName?: string;
  event?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface RejectModalProps {
  isOpen: boolean;
  id: number;
  phone: string;
  reasons: string[];
  agentName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export interface ClaimModalProps {
  isOpen: boolean;
  operators: Operator[];
  onConfirm: (operatorName: string) => void;
  onClose: () => void;
}

export interface SidebarProps {
  siteName: string;
}

export interface AppLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export interface RejectReasonsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface HelpNotificationProps {
  requests: HelpRequest[];
  onClick: () => void;
}

export interface TagListProps {
  items: string[];
  onRemove: (index: number) => void;
}

export interface StatCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  iconClass?: string;
}

export interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export interface RegistrationTableProps {
  registrations: Registration[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  epsFilter: string;
  onEpsFilterChange: (value: string) => void;
  epsList: string[];
  onAccept: (id: number, phone: string) => void;
  onReject: (id: number, phone: string) => void;
  onApprove: (id: number, phone: string, image?: File, event?: string) => void;
  onDeny: (id: number, phone: string) => void;
  onAttend: (id: number) => void;
  onRelease: (id: number) => void;
  agentName: string;
  flowVariables: FlowVariable[];
}

export interface FlowNodeProps<T = any> {
  data: T;
  selected?: boolean;
}

export interface NodePropertiesPanelProps {
  node: FlowNode;
  onUpdate: (nodeId: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}

export interface NodePaletteProps {
  interactionMode: 'pan' | 'select';
  onToggleMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
