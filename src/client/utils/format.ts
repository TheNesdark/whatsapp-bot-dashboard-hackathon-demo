export const dateFormat = (dateString: string): string => {
  // SQLite stores CURRENT_TIMESTAMP as "YYYY-MM-DD HH:MM:SS" in UTC without a
  // timezone marker. Append "Z" so JS parses it as UTC, then display in
  // America/Bogota (UTC-5).
  const normalized = dateString.includes('T') || dateString.endsWith('Z')
    ? dateString
    : dateString.replace(' ', 'T') + 'Z';
  return new Date(normalized).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

export const formatPhone = (phone: string): string => {
  return phone.trim();
};

/** Número para mostrar en UI (con prefijo + si no lo tiene) */
export const displayPhone = (n: string): string => {
  const t = n.replace(/^Bot ->\s*/i, '').trim();
  return t.startsWith('+') ? t : `+${t}`;
};

export const isFromBot = (number: string): boolean => {
  return number.startsWith('Bot ->');
};

export const getPhoneNumber = (number: string): string => {
  return number.replace('Bot -> ', '').trim();
};

/** Texto para mostrar como remitente en la lista de mensajes (número o "Tú") */
export const displaySender = (fromNumber: string): string => {
  if (isFromBot(fromNumber)) return 'Tú';
  const num = getPhoneNumber(fromNumber);
  return num.startsWith('+') ? num : `+${num}`;
};
