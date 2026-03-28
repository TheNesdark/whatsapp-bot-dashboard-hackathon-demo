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
  'Producto A',
  'Producto B',
  'Producto C',
  'Servicio Premium',
  'Soporte',
  'Ventas',
  'Alianzas',
  'Otro',
] as const;

export const DEFAULT_FLOW_APPOINTMENT_TYPES = [
  'Solicitud nueva',
  'Seguimiento',
] as const;

export const DEFAULT_FLOW_MESSAGES = {
  WELCOME:
    'Hola. Bienvenido a la demo. Te haremos unas preguntas breves para registrar tu solicitud.',
  AUTH_INFO:
    'Antes de continuar, necesitamos tu autorizacion para usar la informacion que compartas en esta conversacion.',
  AUTH_TITLE:
    'Autorizas el uso de tus datos para esta demo?',
  AUTH_REJECT:
    'Entendido. No continuaremos sin tu autorizacion. Gracias por visitar la demo.',
  ASK_NAME:
    'Por favor, escribe tu nombre:',
  ASK_CEDULA:
    'Escribe un codigo o referencia:',
  ASK_PHONE:
    'Cual es tu telefono o canal de contacto?',
  ASK_ADDRESS:
    'A que equipo, empresa o ciudad perteneces?',
  ASK_EPS:
    'Selecciona una categoria:',
  ASK_CUSTOM_EPS:
    'Escribe el nombre de la categoria:',
  ASK_APPT:
    'Que tipo de solicitud quieres registrar?',
  END:
    'Registro completado. Tu solicitud demo fue guardada correctamente.',
  OPERATOR:
    'Un miembro del equipo revisara tu solicitud en breve.',
} as const;
