import { createHash } from 'crypto';

const DEMO_CONTACT_PREFIX = 'demo-user-';
const deliveryTargets = new Map<string, string>();

function normalizeRawPhone(phone: string): string {
  return phone.replace(/\s/g, '').replace(/@(c\.us|s\.whatsapp\.net|g\.us)$/i, '');
}

export function isDemoContactId(value: string): boolean {
  return value.startsWith(DEMO_CONTACT_PREFIX);
}

export function getStoredContactId(phone: string): string {
  if (isDemoContactId(phone)) return phone;

  const normalized = normalizeRawPhone(phone);
  const digest = createHash('sha256').update(normalized).digest('hex').slice(0, 12);
  const contactId = `${DEMO_CONTACT_PREFIX}${digest}`;
  deliveryTargets.set(contactId, normalized);
  return contactId;
}

export function resolveDeliveryTarget(contactOrPhone: string): string {
  return deliveryTargets.get(contactOrPhone) ?? contactOrPhone;
}
