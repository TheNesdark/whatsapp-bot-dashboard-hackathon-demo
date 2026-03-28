export const REGISTRATION_STATUSES = [
  'pending',
  'attending',
  'confirming',
  'accepted',
  'rejected',
  'confirmed',
  'cancelled',
] as const;

export type RegistrationStatus = typeof REGISTRATION_STATUSES[number];

export const REGISTRATION_ACTIVE_STATUSES = ['pending', 'attending', 'confirming', 'accepted'] as const;

export const REGISTRATION_ACCEPTABLE_STATUSES = ['pending', 'attending'] as const;
export const REGISTRATION_REJECTABLE_STATUSES = ['pending', 'confirming', 'attending'] as const;

export function isRegistrationStatus(value: string): value is RegistrationStatus {
  return (REGISTRATION_STATUSES as readonly string[]).includes(value);
}

export function includesStatus(
  allowed: readonly RegistrationStatus[],
  value: string,
): boolean {
  return (allowed as readonly string[]).includes(value);
}
