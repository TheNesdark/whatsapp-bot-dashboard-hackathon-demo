import {
  REGISTRATION_ACCEPTABLE_STATUSES,
  REGISTRATION_REJECTABLE_STATUSES,
  type RegistrationStatus,
} from '@shared/registration';

export const REGISTRATION_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  accepted: { label: 'Aceptado', cls: 'badge--accepted' },
  rejected: { label: 'Rechazado', cls: 'badge--rejected' },
  confirmed: { label: 'Confirmado', cls: 'badge--confirmed' },
  cancelled: { label: 'Cancelado', cls: 'badge--cancelled' },
  confirming: { label: 'Confirmando', cls: 'badge--confirming' },
  pending: { label: 'Pendiente', cls: 'badge--pending' },
  attending: { label: 'Atendiendo', cls: 'badge--attending' },
};

export const REGISTRATION_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'attending', label: 'Atendiendo' },
  { value: 'confirming', label: 'Confirmando' },
  { value: 'accepted', label: 'Aceptado' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'rejected', label: 'Rechazado' },
];

export const CAN_ACCEPT_STATUSES = new Set<string>(REGISTRATION_ACCEPTABLE_STATUSES);
export const CAN_REJECT_STATUSES = new Set<string>(REGISTRATION_REJECTABLE_STATUSES);
