import type { FlowNodeType } from '@shared/flow';

export const MAX_FLOW_PAYLOAD_BYTES = 500 * 1024;

export const VALID_FLOW_NODE_TYPES = new Set<FlowNodeType>([
  'start',
  'message',
  'media',
  'question',
  'menu',
  'buttons',
  'condition',
  'end',
  'operator',
  'operator_approval',
  'event',
  'return',
]);

export const DEFAULT_FLOW_EPS = [
  'Ventas',
  'Soporte',
  'Otros',
] as const;

export const DEFAULT_FLOW_APPOINTMENT_TYPES = [
  'Nueva Consulta',
  'Reclamo',
] as const;

export const DEFAULT_FLOW_MESSAGES = {
  WELCOME:
    '¡Hola! Bienvenido a nuestra demo de WhatsApp Bot.',
  AUTH_INFO:
    'Para continuar, ¿aceptas los términos de uso de esta demo?',
  AUTH_TITLE:
    '¿Autorizas el tratamiento de datos?',
  AUTH_REJECT:
    'Entendido. Si cambias de opinión, aquí estaremos. ¡Adiós!',
  ASK_NAME:
    '¿Cuál es tu nombre?',
  ASK_CEDULA:
    'Por favor, ingresa tu número de identificación:',
  ASK_PHONE:
    '¿A qué número podemos contactarte?',
  ASK_ADDRESS:
    '¿Desde qué ciudad nos escribes?',
  ASK_EPS:
    'Selecciona el área de interés:',
  ASK_CUSTOM_EPS:
    'Escribe el nombre del área:',
  ASK_APPT:
    '¿Qué tipo de gestión deseas realizar?',
  END:
    '¡Listo! Hemos recibido tu información. Pronto nos pondremos en contacto.',
  OPERATOR:
    'Te estamos transfiriendo con un asesor...',
} as const;
